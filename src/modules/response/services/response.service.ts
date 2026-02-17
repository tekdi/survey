import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import {
  SurveyResponse,
  ResponseStatus,
} from '../entities/survey-response.entity';
import {
  CreateResponseDto,
  UpdateResponseDto,
  SubmitResponseDto,
} from '../dto/create-response.dto';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { APIResponse } from '@/common/responses/api-response';
import { APIID } from '@/common/utils/api-id.config';
import { RESPONSE_MESSAGES } from '@/common/utils/response-messages';
import { SurveyService } from '@/modules/survey/services/survey.service';
import { SurveyStatus } from '@/modules/survey/entities/survey.entity';
import { ReportSyncService } from '@/modules/report-sync/services/report-sync.service';
import { SurveyEventType } from '@/modules/report-sync/config/report-events.config';

@Injectable()
export class ResponseService {
  private readonly logger = new Logger(ResponseService.name);

  constructor(
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
    private readonly surveyService: SurveyService,
    private readonly reportSyncService: ReportSyncService,
  ) {}

  async create(
    request: Request,
    tenantId: string,
    userId: string,
    dto: CreateResponseDto,
    response: Response,
  ) {
    const apiId = APIID.RESPONSE_CREATE;
    try {
      // Verify survey exists and is published
      const survey = await this.surveyService.getSurveyWithRelations(tenantId, dto.surveyId);
      if (survey.status !== SurveyStatus.PUBLISHED) {
        throw new BadRequestException(RESPONSE_MESSAGES.RESPONSE_NOT_ACCEPTING);
      }

      // Check if multiple submissions allowed
      if (!survey.settings?.allowMultipleSubmissions) {
        const existing = await this.responseRepo.findOne({
          where: {
            tenantId,
            surveyId: dto.surveyId,
            respondentId: userId,
            status: ResponseStatus.SUBMITTED,
          },
        });
        if (existing) {
          throw new BadRequestException(RESPONSE_MESSAGES.RESPONSE_DUPLICATE_SUBMISSION);
        }
      }

      const surveyResponse = this.responseRepo.create({
        tenantId,
        surveyId: dto.surveyId,
        respondentId: userId,
        responseData: dto.responseData || {},
        responseMetadata: {
          ...dto.responseMetadata,
          startedAt: new Date().toISOString(),
        },
        status: ResponseStatus.IN_PROGRESS,
        createdBy: userId,
        updatedBy: userId,
      });

      const saved = await this.responseRepo.save(surveyResponse);

      // Sync to reporting DB
      this.reportSyncService
        .syncResponseEvent(SurveyEventType.RESPONSE_STARTED, {
          responseId: saved.responseId,
          surveyId: saved.surveyId,
          tenantId: saved.tenantId,
          respondentId: saved.respondentId,
          status: saved.status,
        })
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      return APIResponse.success(
        response,
        apiId,
        saved,
        HttpStatus.CREATED,
        RESPONSE_MESSAGES.RESPONSE_CREATE_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Response create failed: ${e.message}`, e.stack);
      const status =
        e instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, e.message, e.name || 'Bad Request', status);
    }
  }

  async findAllBySurvey(
    request: Request,
    tenantId: string,
    surveyId: string,
    pagination: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' },
    response: Response,
  ) {
    const apiId = APIID.RESPONSE_LIST;
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'DESC';
      const skip = (page - 1) * limit;

      const [responses, total] = await this.responseRepo.findAndCount({
        where: { tenantId, surveyId },
        order: { [sortBy]: sortOrder },
        skip,
        take: limit,
      });

      const result = new PaginatedResponseDto(responses, total, page, limit);

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_LIST_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Response list failed: ${e.message}`, e.stack);
      return APIResponse.error(
        response,
        apiId,
        e.message,
        e.name || 'Internal Server Error',
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(
    request: Request,
    tenantId: string,
    responseId: string,
    response: Response,
  ) {
    const apiId = APIID.RESPONSE_READ;
    try {
      const surveyResponse = await this.getResponseById(tenantId, responseId);

      return APIResponse.success(
        response,
        apiId,
        surveyResponse,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_READ_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Response read failed: ${e.message}`, e.stack);
      const status =
        e instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, e.message, e.name, status);
    }
  }

  async update(
    request: Request,
    tenantId: string,
    responseId: string,
    userId: string,
    dto: UpdateResponseDto,
    response: Response,
  ) {
    const apiId = APIID.RESPONSE_UPDATE;
    try {
      const surveyResponse = await this.getResponseById(tenantId, responseId);

      if (surveyResponse.status === ResponseStatus.SUBMITTED) {
        throw new BadRequestException(RESPONSE_MESSAGES.RESPONSE_CANNOT_UPDATE);
      }

      if (surveyResponse.respondentId !== userId) {
        throw new ForbiddenException('You can only update your own response');
      }

      // Merge response data (partial updates)
      if (dto.responseData) {
        surveyResponse.responseData = {
          ...surveyResponse.responseData,
          ...dto.responseData,
        };
      }

      if (dto.fileUploadIds) {
        surveyResponse.fileUploadIds = {
          ...surveyResponse.fileUploadIds,
          ...dto.fileUploadIds,
        };
      }

      if (dto.responseMetadata) {
        surveyResponse.responseMetadata = {
          ...surveyResponse.responseMetadata,
          ...dto.responseMetadata,
        };
      }

      surveyResponse.updatedBy = userId;
      const saved = await this.responseRepo.save(surveyResponse);

      // Sync to reporting DB
      this.reportSyncService
        .syncResponseEvent(SurveyEventType.RESPONSE_UPDATED, {
          responseId: saved.responseId,
          surveyId: saved.surveyId,
          tenantId: saved.tenantId,
          status: saved.status,
        })
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      return APIResponse.success(
        response,
        apiId,
        saved,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_UPDATE_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Response update failed: ${e.message}`, e.stack);
      const status =
        e instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : e instanceof ForbiddenException
            ? HttpStatus.FORBIDDEN
            : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, e.message, e.name, status);
    }
  }

  async submit(
    request: Request,
    tenantId: string,
    responseId: string,
    userId: string,
    dto: SubmitResponseDto,
    response: Response,
  ) {
    const apiId = APIID.RESPONSE_SUBMIT;
    try {
      const surveyResponse = await this.getResponseById(tenantId, responseId);

      if (surveyResponse.status === ResponseStatus.SUBMITTED) {
        throw new BadRequestException(RESPONSE_MESSAGES.RESPONSE_ALREADY_SUBMITTED);
      }

      if (surveyResponse.respondentId !== userId) {
        throw new ForbiddenException('You can only submit your own response');
      }

      // Merge any final data
      if (dto.responseData) {
        surveyResponse.responseData = {
          ...surveyResponse.responseData,
          ...dto.responseData,
        };
      }

      if (dto.fileUploadIds) {
        surveyResponse.fileUploadIds = {
          ...surveyResponse.fileUploadIds,
          ...dto.fileUploadIds,
        };
      }

      // Validate required fields
      const survey = await this.surveyService.getSurveyWithRelations(
        tenantId,
        surveyResponse.surveyId,
      );
      this.validateRequiredFields(survey, surveyResponse);

      // Mark as submitted
      surveyResponse.status = ResponseStatus.SUBMITTED;
      surveyResponse.submittedAt = new Date();
      surveyResponse.updatedBy = userId;
      surveyResponse.responseMetadata = {
        ...surveyResponse.responseMetadata,
        completedAt: new Date().toISOString(),
        timeSpentSeconds: this.calculateTimeSpent(surveyResponse),
      };

      const saved = await this.responseRepo.save(surveyResponse);

      // Sync to reporting DB
      this.reportSyncService
        .syncResponseEvent(SurveyEventType.RESPONSE_SUBMITTED, {
          responseId: saved.responseId,
          surveyId: saved.surveyId,
          tenantId: saved.tenantId,
          respondentId: saved.respondentId,
          status: saved.status,
          responseData: saved.responseData,
          submittedAt: saved.submittedAt,
        })
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      return APIResponse.success(
        response,
        apiId,
        saved,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_SUBMIT_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Response submit failed: ${e.message}`, e.stack);
      const status =
        e instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : e instanceof ForbiddenException
            ? HttpStatus.FORBIDDEN
            : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, e.message, e.name, status);
    }
  }

  async getStats(
    request: Request,
    tenantId: string,
    surveyId: string,
    response: Response,
  ) {
    const apiId = APIID.RESPONSE_STATS;
    try {
      const stats = await this.responseRepo
        .createQueryBuilder('r')
        .select([
          'COUNT(*) as "totalResponses"',
          'COUNT(CASE WHEN r.status = :submitted THEN 1 END) as "submittedResponses"',
          'COUNT(CASE WHEN r.status = :inProgress THEN 1 END) as "inProgressResponses"',
        ])
        .where('r."tenantId" = :tenantId AND r."surveyId" = :surveyId', {
          tenantId,
          surveyId,
          submitted: ResponseStatus.SUBMITTED,
          inProgress: ResponseStatus.IN_PROGRESS,
        })
        .getRawOne();

      const result = {
        totalResponses: parseInt(stats.totalResponses, 10),
        submittedResponses: parseInt(stats.submittedResponses, 10),
        inProgressResponses: parseInt(stats.inProgressResponses, 10),
        averageTimeSpent: 0,
      };

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_STATS_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Response stats failed: ${e.message}`, e.stack);
      return APIResponse.error(
        response,
        apiId,
        e.message,
        e.name || 'Internal Server Error',
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- Internal helpers (no response object) ---

  async getResponseById(
    tenantId: string,
    responseId: string,
  ): Promise<SurveyResponse> {
    const surveyResponse = await this.responseRepo.findOne({
      where: { responseId, tenantId },
    });

    if (!surveyResponse) {
      throw new NotFoundException(RESPONSE_MESSAGES.RESPONSE_NOT_FOUND);
    }

    return surveyResponse;
  }

  private validateRequiredFields(survey: any, surveyResponse: SurveyResponse): void {
    const errors: string[] = [];

    for (const section of survey.sections || []) {
      for (const field of section.fields || []) {
        if (field.isRequired) {
          const value = surveyResponse.responseData[field.fieldId];
          const fileIds = surveyResponse.fileUploadIds[field.fieldId];

          const isUploadField = ['image_upload', 'video_upload', 'file_upload'].includes(
            field.fieldType,
          );

          if (isUploadField) {
            if (!fileIds || fileIds.length === 0) {
              errors.push(`${field.fieldLabel} is required`);
            }
          } else if (value === undefined || value === null || value === '') {
            errors.push(`${field.fieldLabel} is required`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: RESPONSE_MESSAGES.RESPONSE_VALIDATION_FAILED,
        errors,
      });
    }
  }

  private calculateTimeSpent(surveyResponse: SurveyResponse): number {
    const startedAt = surveyResponse.responseMetadata?.startedAt;
    if (!startedAt) return 0;

    const start = new Date(startedAt).getTime();
    const end = Date.now();
    return Math.round((end - start) / 1000);
  }
}
