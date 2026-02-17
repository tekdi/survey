import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Request, Response } from 'express';
import { Survey, SurveyStatus } from '../entities/survey.entity';
import { SurveySection } from '../entities/survey-section.entity';
import { SurveyField } from '../entities/survey-field.entity';
import { CreateSurveyDto } from '../dto/create-survey.dto';
import { UpdateSurveyDto } from '../dto/update-survey.dto';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { APIResponse } from '@/common/responses/api-response';
import { APIID } from '@/common/utils/api-id.config';
import { RESPONSE_MESSAGES } from '@/common/utils/response-messages';
import { ReportSyncService } from '@/modules/report-sync/services/report-sync.service';

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveySection)
    private readonly sectionRepo: Repository<SurveySection>,
    @InjectRepository(SurveyField)
    private readonly fieldRepo: Repository<SurveyField>,
    private readonly dataSource: DataSource,
    private readonly reportSyncService: ReportSyncService,
  ) {}

  async create(
    request: Request,
    tenantId: string,
    userId: string,
    dto: CreateSurveyDto,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_CREATE;
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const survey = queryRunner.manager.create(Survey, {
          tenantId,
          surveyTitle: dto.survey_title,
          surveyDescription: dto.survey_description,
          surveyType: dto.survey_type,
          settings: dto.settings || {},
          theme: dto.theme || {},
          createdBy: userId,
          updatedBy: userId,
          status: SurveyStatus.DRAFT,
        });
        const savedSurvey = await queryRunner.manager.save(survey);

        if (dto.sections?.length) {
          for (let i = 0; i < dto.sections.length; i++) {
            const sectionDto = dto.sections[i];
            const section = queryRunner.manager.create(SurveySection, {
              surveyId: savedSurvey.surveyId,
              tenantId,
              sectionTitle: sectionDto.section_title,
              sectionDescription: sectionDto.section_description,
              displayOrder: sectionDto.display_order ?? i,
              isVisible: sectionDto.is_visible ?? true,
              conditionalLogic: sectionDto.conditional_logic,
            });
            const savedSection = await queryRunner.manager.save(section);

            if (sectionDto.fields?.length) {
              for (let j = 0; j < sectionDto.fields.length; j++) {
                const fieldDto = sectionDto.fields[j];
                const field = queryRunner.manager.create(SurveyField, {
                  sectionId: savedSection.sectionId,
                  surveyId: savedSurvey.surveyId,
                  tenantId,
                  fieldName: fieldDto.field_name,
                  fieldLabel: fieldDto.field_label,
                  fieldType: fieldDto.field_type,
                  isRequired: fieldDto.is_required ?? false,
                  displayOrder: fieldDto.display_order ?? j,
                  placeholder: fieldDto.placeholder,
                  helpText: fieldDto.help_text,
                  defaultValue: fieldDto.default_value,
                  validations: fieldDto.validations || {},
                  dataSource: fieldDto.data_source,
                  uploadConfig: fieldDto.upload_config,
                  uiConfig: fieldDto.ui_config || {},
                  conditionalLogic: fieldDto.conditional_logic,
                });
                await queryRunner.manager.save(field);
              }
            }
          }
        }

        await queryRunner.commitTransaction();

        const result = await this.getSurveyWithRelations(tenantId, savedSurvey.surveyId);

        // Sync to reporting DB
        this.reportSyncService
          .syncSurveyEvent('SURVEY_CREATED', result)
          .catch((err) => this.logger.error('Report sync failed', err.stack));

        return APIResponse.success(
          response,
          apiId,
          result,
          HttpStatus.CREATED,
          RESPONSE_MESSAGES.SURVEY_CREATE_SUCCESS,
        );
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (e) {
      this.logger.error(`Survey create failed: ${e.message}`, e.stack);
      return APIResponse.error(
        response,
        apiId,
        e.message,
        e.name || 'Bad Request',
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    request: Request,
    tenantId: string,
    pagination: PaginationDto,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_LIST;
    try {
      const [surveys, total] = await this.surveyRepo.findAndCount({
        where: { tenantId },
        order: { [pagination.sortBy]: pagination.sortOrder },
        skip: pagination.skip,
        take: pagination.limit,
      });

      const result = new PaginatedResponseDto(
        surveys,
        total,
        pagination.page,
        pagination.limit,
      );

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_LIST_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Survey list failed: ${e.message}`, e.stack);
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
    surveyId: string,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_READ;
    try {
      const survey = await this.getSurveyWithRelations(tenantId, surveyId);

      return APIResponse.success(
        response,
        apiId,
        survey,
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_READ_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Survey read failed: ${e.message}`, e.stack);
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
    surveyId: string,
    dto: UpdateSurveyDto,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_UPDATE;
    try {
      const survey = await this.getSurveyWithRelations(tenantId, surveyId);

      if (
        survey.status === SurveyStatus.CLOSED ||
        survey.status === SurveyStatus.ARCHIVED
      ) {
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_CANNOT_UPDATE);
      }

      Object.assign(survey, {
        surveyTitle: dto.survey_title ?? survey.surveyTitle,
        surveyDescription: dto.survey_description ?? survey.surveyDescription,
        surveyType: dto.survey_type ?? survey.surveyType,
        settings: dto.settings ?? survey.settings,
        theme: dto.theme ?? survey.theme,
        version: survey.version + 1,
      });

      await this.surveyRepo.save(survey);
      const result = await this.getSurveyWithRelations(tenantId, surveyId);

      this.reportSyncService
        .syncSurveyEvent('SURVEY_UPDATED', result)
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_UPDATE_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Survey update failed: ${e.message}`, e.stack);
      return APIResponse.error(
        response,
        apiId,
        e.message,
        e.name,
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async publish(
    request: Request,
    tenantId: string,
    surveyId: string,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_PUBLISH;
    try {
      const survey = await this.getSurveyWithRelations(tenantId, surveyId);

      if (survey.status !== SurveyStatus.DRAFT) {
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_CANNOT_PUBLISH);
      }

      if (!survey.sections?.length) {
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_NEEDS_SECTION);
      }

      const hasFields = survey.sections.some(
        (s) => s.fields && s.fields.length > 0,
      );
      if (!hasFields) {
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_NEEDS_FIELD);
      }

      survey.status = SurveyStatus.PUBLISHED;
      survey.publishedAt = new Date();
      await this.surveyRepo.save(survey);

      this.reportSyncService
        .syncSurveyEvent('SURVEY_PUBLISHED', survey)
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      return APIResponse.success(
        response,
        apiId,
        survey,
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_PUBLISH_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`Survey publish failed: ${e.message}`, e.stack);
      return APIResponse.error(
        response,
        apiId,
        e.message,
        e.name,
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async close(
    request: Request,
    tenantId: string,
    surveyId: string,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_CLOSE;
    try {
      const survey = await this.getSurveyWithRelations(tenantId, surveyId);

      if (survey.status !== SurveyStatus.PUBLISHED) {
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_CANNOT_CLOSE);
      }

      survey.status = SurveyStatus.CLOSED;
      survey.closedAt = new Date();
      await this.surveyRepo.save(survey);

      this.reportSyncService
        .syncSurveyEvent('SURVEY_CLOSED', survey)
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      return APIResponse.success(
        response,
        apiId,
        survey,
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_CLOSE_SUCCESS,
      );
    } catch (e) {
      return APIResponse.error(
        response,
        apiId,
        e.message,
        e.name,
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(
    request: Request,
    tenantId: string,
    surveyId: string,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_DELETE;
    try {
      const survey = await this.getSurveyWithRelations(tenantId, surveyId);

      if (survey.status === SurveyStatus.PUBLISHED) {
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_CANNOT_DELETE);
      }

      await this.surveyRepo.remove(survey);

      this.reportSyncService
        .syncSurveyEvent('SURVEY_DELETED', { surveyId, tenantId })
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      return APIResponse.success(
        response,
        apiId,
        { surveyId },
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_DELETE_SUCCESS,
      );
    } catch (e) {
      return APIResponse.error(
        response,
        apiId,
        e.message,
        e.name,
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async duplicate(
    request: Request,
    tenantId: string,
    surveyId: string,
    userId: string,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_DUPLICATE;
    try {
      const original = await this.getSurveyWithRelations(tenantId, surveyId);

      const dto: CreateSurveyDto = {
        survey_title: `${original.surveyTitle} (Copy)`,
        survey_description: original.surveyDescription,
        survey_type: original.surveyType,
        settings: original.settings,
        theme: original.theme,
        sections: original.sections?.map((section) => ({
          section_title: section.sectionTitle,
          section_description: section.sectionDescription,
          display_order: section.displayOrder,
          is_visible: section.isVisible,
          conditional_logic: section.conditionalLogic,
          fields: section.fields?.map((field) => ({
            field_name: field.fieldName,
            field_label: field.fieldLabel,
            field_type: field.fieldType,
            is_required: field.isRequired,
            display_order: field.displayOrder,
            placeholder: field.placeholder,
            help_text: field.helpText,
            default_value: field.defaultValue,
            validations: field.validations,
            data_source: field.dataSource,
            upload_config: field.uploadConfig,
            ui_config: field.uiConfig,
            conditional_logic: field.conditionalLogic,
          })),
        })),
      };

      // Delegate to create, which handles its own response
      return this.create(request, tenantId, userId, dto, response);
    } catch (e) {
      return APIResponse.error(
        response,
        apiId,
        e.message,
        e.name,
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- Internal helpers (no response object) ---

  async getSurveyWithRelations(
    tenantId: string,
    surveyId: string,
  ): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { surveyId, tenantId },
      relations: ['sections', 'sections.fields'],
      order: {
        sections: {
          displayOrder: 'ASC',
          fields: {
            displayOrder: 'ASC',
          },
        },
      },
    });

    if (!survey) {
      throw new NotFoundException(RESPONSE_MESSAGES.SURVEY_NOT_FOUND);
    }

    return survey;
  }
}
