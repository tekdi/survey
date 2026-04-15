import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
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
import { SurveyStatus, SurveyContextType } from '@/modules/survey/entities/survey.entity';
import { KafkaService } from '@/kafka/kafka.service';
import { LoggerService } from '@/common/logger/logger.service';

@Injectable()
export class ResponseService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
    private readonly surveyService: SurveyService,
    private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
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
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.RESPONSE_NOT_ACCEPTING,
          apiId,
          userId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.RESPONSE_NOT_ACCEPTING);
      }

      // Validate contextId is provided when survey requires a context entity
      const requiresContext = survey.contextType && 
        survey.contextType !== SurveyContextType.NONE && 
        survey.contextType !== SurveyContextType.SELF;

      if (requiresContext && !dto.contextId) {
        throw new BadRequestException(
          `This survey requires a contextId (context_type: ${survey.contextType}). Please provide the ID of the ${survey.contextType} this response is for.`,
        );
      }

      // Check if multiple submissions allowed
      if (!survey.settings?.allowMultipleSubmissions) {
        const duplicateWhere: any = {
          tenantId,
          surveyId: dto.surveyId,
          respondentId: userId,
          status: ResponseStatus.SUBMITTED,
        };
        // If survey has context, check duplicate per context entity
        if (requiresContext && dto.contextId) {
          duplicateWhere.contextId = dto.contextId;
        }
        const existing = await this.responseRepo.findOne({
          where: duplicateWhere,
        });
        if (existing) {
          this.loggerService.error(
            'BAD_REQUEST',
            RESPONSE_MESSAGES.RESPONSE_DUPLICATE_SUBMISSION,
            apiId,
            userId,
          );
          throw new BadRequestException(RESPONSE_MESSAGES.RESPONSE_DUPLICATE_SUBMISSION);
        }
      }

      const surveyResponse = this.responseRepo.create({
        tenantId,
        surveyId: dto.surveyId,
        respondentId: userId,
        contextType: survey.contextType || null,
        contextId: dto.contextId || null,
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

      // Publish event to Kafka
      this.kafkaService
        .publishResponseEvent('started', {
          responseId: saved.responseId,
          surveyId: saved.surveyId,
          tenantId: saved.tenantId,
          respondentId: saved.respondentId,
          status: saved.status,
        }, saved.responseId)
        .catch((err) => 
          this.loggerService.error('Kafka publish failed', err.message, apiId, userId)
        );

      this.loggerService.log(
        RESPONSE_MESSAGES.RESPONSE_CREATE_SUCCESS,
        apiId,
        userId,
      );

      return APIResponse.success(
        response,
        apiId,
        saved,
        HttpStatus.CREATED,
        RESPONSE_MESSAGES.RESPONSE_CREATE_SUCCESS,
      );
    } catch (e) {
      const errorMessage = e.message || 'Internal Server Error';
      this.loggerService.error(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        apiId,
        userId,
      );
      const status =
        e instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, errorMessage, e.name || 'BAD_REQUEST', status);
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

      this.loggerService.log(
        RESPONSE_MESSAGES.RESPONSE_LIST_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_LIST_SUCCESS,
      );
    } catch (e) {
      const errorMessage = e.message || 'Internal Server Error';
      this.loggerService.error(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        apiId,
      );
      return APIResponse.error(
        response,
        apiId,
        errorMessage,
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

      this.loggerService.log(
        RESPONSE_MESSAGES.RESPONSE_READ_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        surveyResponse,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_READ_SUCCESS,
      );
    } catch (e) {
      const errorMessage = e.message || 'Internal Server Error';
      this.loggerService.error(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        apiId,
      );
      const status =
        e instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, errorMessage, e.name, status);
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
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.RESPONSE_CANNOT_UPDATE,
          apiId,
          userId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.RESPONSE_CANNOT_UPDATE);
      }

      if (surveyResponse.respondentId !== userId) {
        this.loggerService.error(
          'FORBIDDEN',
          'You can only update your own response',
          apiId,
          userId,
        );
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

      // Publish event to Kafka
      this.kafkaService
        .publishResponseEvent('updated', {
          responseId: saved.responseId,
          surveyId: saved.surveyId,
          tenantId: saved.tenantId,
          status: saved.status,
        }, saved.responseId)
        .catch((err) => 
          this.loggerService.error('Kafka publish failed', err.message, apiId, userId)
        );

      this.loggerService.log(
        RESPONSE_MESSAGES.RESPONSE_UPDATE_SUCCESS,
        apiId,
        userId,
      );

      return APIResponse.success(
        response,
        apiId,
        saved,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_UPDATE_SUCCESS,
      );
    } catch (e) {
      const errorMessage = e.message || 'Internal Server Error';
      this.loggerService.error(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        apiId,
        userId,
      );
      const status =
        e instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : e instanceof ForbiddenException
            ? HttpStatus.FORBIDDEN
            : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, errorMessage, e.name, status);
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
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.RESPONSE_ALREADY_SUBMITTED,
          apiId,
          userId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.RESPONSE_ALREADY_SUBMITTED);
      }

      if (surveyResponse.respondentId !== userId) {
        this.loggerService.error(
          'FORBIDDEN',
          'You can only submit your own response',
          apiId,
          userId,
        );
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

      // Publish event to Kafka
      this.kafkaService
        .publishResponseEvent('submitted', {
          responseId: saved.responseId,
          surveyId: saved.surveyId,
          tenantId: saved.tenantId,
          respondentId: saved.respondentId,
          status: saved.status,
          responseData: saved.responseData,
          submittedAt: saved.submittedAt,
        }, saved.responseId)
        .catch((err) => 
          this.loggerService.error('Kafka publish failed', err.message, apiId, userId)
        );

      this.loggerService.log(
        RESPONSE_MESSAGES.RESPONSE_SUBMIT_SUCCESS,
        apiId,
        userId,
      );

      return APIResponse.success(
        response,
        apiId,
        saved,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_SUBMIT_SUCCESS,
      );
    } catch (e) {
      const errorMessage = e.message || 'Internal Server Error';
      this.loggerService.error(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        apiId,
        userId,
      );
      const status =
        e instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : e instanceof ForbiddenException
            ? HttpStatus.FORBIDDEN
            : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, errorMessage, e.name, status);
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

      this.loggerService.log(
        RESPONSE_MESSAGES.RESPONSE_STATS_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        RESPONSE_MESSAGES.RESPONSE_STATS_SUCCESS,
      );
    } catch (e) {
      const errorMessage = e.message || 'Internal Server Error';
      this.loggerService.error(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        apiId,
      );
      return APIResponse.error(
        response,
        apiId,
        errorMessage,
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
