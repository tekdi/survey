import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SurveyResponse,
  ResponseStatus,
} from '../entities/survey-response.entity';
import {
  CreateResponseDto,
  UpdateResponseDto,
  SubmitResponseDto,
} from '../dto/create-response.dto';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '@/common/dto/pagination.dto';
import { SurveyService } from '@/modules/survey/services/survey.service';
import { SurveyStatus } from '@/modules/survey/entities/survey.entity';

@Injectable()
export class ResponseService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
    private readonly surveyService: SurveyService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateResponseDto,
  ): Promise<SurveyResponse> {
    // Verify survey exists and is published
    const survey = await this.surveyService.findOne(tenantId, dto.survey_id);
    if (survey.status !== SurveyStatus.PUBLISHED) {
      throw new BadRequestException('Survey is not accepting responses');
    }

    // Check if multiple submissions allowed
    if (!survey.settings?.allowMultipleSubmissions) {
      const existing = await this.responseRepo.findOne({
        where: {
          tenant_id: tenantId,
          survey_id: dto.survey_id,
          respondent_id: userId,
          status: ResponseStatus.SUBMITTED,
        },
      });
      if (existing) {
        throw new BadRequestException(
          'You have already submitted a response to this survey',
        );
      }
    }

    const response = this.responseRepo.create({
      tenant_id: tenantId,
      survey_id: dto.survey_id,
      respondent_id: userId,
      response_data: dto.response_data || {},
      response_metadata: {
        ...dto.response_metadata,
        startedAt: new Date().toISOString(),
      },
      status: ResponseStatus.IN_PROGRESS,
    });

    return this.responseRepo.save(response);
  }

  async findAllBySurvey(
    tenantId: string,
    surveyId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<SurveyResponse>> {
    const [responses, total] = await this.responseRepo.findAndCount({
      where: { tenant_id: tenantId, survey_id: surveyId },
      order: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResponseDto(
      responses,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(
    tenantId: string,
    responseId: string,
  ): Promise<SurveyResponse> {
    const response = await this.responseRepo.findOne({
      where: { response_id: responseId, tenant_id: tenantId },
    });

    if (!response) {
      throw new NotFoundException(`Response ${responseId} not found`);
    }

    return response;
  }

  async update(
    tenantId: string,
    responseId: string,
    userId: string,
    dto: UpdateResponseDto,
  ): Promise<SurveyResponse> {
    const response = await this.findOne(tenantId, responseId);

    if (response.status === ResponseStatus.SUBMITTED) {
      throw new BadRequestException('Cannot update a submitted response');
    }

    if (response.respondent_id !== userId) {
      throw new ForbiddenException('You can only update your own response');
    }

    // Merge response data (partial updates)
    if (dto.response_data) {
      response.response_data = {
        ...response.response_data,
        ...dto.response_data,
      };
    }

    if (dto.file_upload_ids) {
      response.file_upload_ids = {
        ...response.file_upload_ids,
        ...dto.file_upload_ids,
      };
    }

    if (dto.response_metadata) {
      response.response_metadata = {
        ...response.response_metadata,
        ...dto.response_metadata,
      };
    }

    return this.responseRepo.save(response);
  }

  async submit(
    tenantId: string,
    responseId: string,
    userId: string,
    dto: SubmitResponseDto,
  ): Promise<SurveyResponse> {
    const response = await this.findOne(tenantId, responseId);

    if (response.status === ResponseStatus.SUBMITTED) {
      throw new BadRequestException('Response already submitted');
    }

    if (response.respondent_id !== userId) {
      throw new ForbiddenException('You can only submit your own response');
    }

    // Merge any final data
    if (dto.response_data) {
      response.response_data = {
        ...response.response_data,
        ...dto.response_data,
      };
    }

    if (dto.file_upload_ids) {
      response.file_upload_ids = {
        ...response.file_upload_ids,
        ...dto.file_upload_ids,
      };
    }

    // Validate required fields
    const survey = await this.surveyService.findOne(
      tenantId,
      response.survey_id,
    );
    this.validateRequiredFields(survey, response);

    // Mark as submitted
    response.status = ResponseStatus.SUBMITTED;
    response.submitted_at = new Date();
    response.response_metadata = {
      ...response.response_metadata,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: this.calculateTimeSpent(response),
    };

    return this.responseRepo.save(response);
  }

  async getStats(
    tenantId: string,
    surveyId: string,
  ): Promise<{
    totalResponses: number;
    submittedResponses: number;
    inProgressResponses: number;
    averageTimeSpent: number;
  }> {
    const stats = await this.responseRepo
      .createQueryBuilder('r')
      .select([
        'COUNT(*) as "totalResponses"',
        'COUNT(CASE WHEN r.status = :submitted THEN 1 END) as "submittedResponses"',
        'COUNT(CASE WHEN r.status = :inProgress THEN 1 END) as "inProgressResponses"',
      ])
      .where('r.tenant_id = :tenantId AND r.survey_id = :surveyId', {
        tenantId,
        surveyId,
        submitted: ResponseStatus.SUBMITTED,
        inProgress: ResponseStatus.IN_PROGRESS,
      })
      .getRawOne();

    return {
      totalResponses: parseInt(stats.totalResponses, 10),
      submittedResponses: parseInt(stats.submittedResponses, 10),
      inProgressResponses: parseInt(stats.inProgressResponses, 10),
      averageTimeSpent: 0, // Could be computed from response_metadata
    };
  }

  private validateRequiredFields(survey: any, response: SurveyResponse): void {
    const errors: string[] = [];

    for (const section of survey.sections || []) {
      for (const field of section.fields || []) {
        if (field.is_required) {
          const value = response.response_data[field.field_id];
          const fileIds = response.file_upload_ids[field.field_id];

          const isUploadField = ['image_upload', 'video_upload', 'file_upload'].includes(
            field.field_type,
          );

          if (isUploadField) {
            if (!fileIds || fileIds.length === 0) {
              errors.push(
                `${field.field_label} is required`,
              );
            }
          } else if (value === undefined || value === null || value === '') {
            errors.push(`${field.field_label} is required`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
  }

  private calculateTimeSpent(response: SurveyResponse): number {
    const startedAt = response.response_metadata?.startedAt;
    if (!startedAt) return 0;

    const start = new Date(startedAt).getTime();
    const end = Date.now();
    return Math.round((end - start) / 1000);
  }
}
