import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Request, Response } from 'express';
import { Survey, SurveyStatus, SurveyContextType } from '../entities/survey.entity';
import { SurveySection } from '../entities/survey-section.entity';
import { SurveyField } from '../entities/survey-field.entity';
import { CreateSurveyDto } from '../dto/create-survey.dto';
import { UpdateSurveyDto } from '../dto/update-survey.dto';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { APIResponse } from '@/common/responses/api-response';
import { APIID } from '@/common/utils/api-id.config';
import { RESPONSE_MESSAGES } from '@/common/utils/response-messages';
import { KafkaService } from '@/kafka/kafka.service';
import { LoggerService } from '@/common/logger/logger.service';
import { DataSourceService } from './data-source.service';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveySection)
    private readonly sectionRepo: Repository<SurveySection>,
    @InjectRepository(SurveyField)
    private readonly fieldRepo: Repository<SurveyField>,
    private readonly dataSource: DataSource,
    private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
    private readonly dataSourceService: DataSourceService,
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
          targetRoles: dto.target_roles || null,
          contextType: dto.context_type || SurveyContextType.NONE,
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

        // Publish event to Kafka
        this.kafkaService
          .publishSurveyEvent('created', result, savedSurvey.surveyId)
          .catch((err) => 
            this.loggerService.error('Kafka publish failed', err.message, apiId, userId)
          );

        this.loggerService.log(
          RESPONSE_MESSAGES.SURVEY_CREATE_SUCCESS,
          apiId,
          userId,
        );

        return APIResponse.success(
          response,
          apiId,
          { data: result },
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
      const errorMessage = e.message || 'Internal Server Error';
      this.loggerService.error(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        apiId,
        userId,
      );
      return APIResponse.error(
        response,
        apiId,
        errorMessage,
        e.name || 'BAD_REQUEST',
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    request: Request,
    tenantId: string,
    pagination: PaginationDto,
    userRoles: string[],
    response: Response,
  ) {
    const apiId = APIID.SURVEY_LIST;
    try {
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'DESC';
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;

      const isAdmin = userRoles.includes('admin');

      let queryBuilder = this.surveyRepo
        .createQueryBuilder('survey')
        .where('survey.tenantId = :tenantId', { tenantId });

      // Admin sees all surveys; non-admin sees only surveys targeted to their role (or with no target restriction)
      if (!isAdmin && userRoles.length > 0) {
        // Check if ANY of the user's roles exist in survey.targetRoles JSONB array
        // In TypeORM, ?? escapes the literal ? character for PostgreSQL's ?| operator
        queryBuilder = queryBuilder.andWhere(
          '(survey."targetRoles" IS NULL OR survey."targetRoles" ??| ARRAY[:...userRoles])',
          { userRoles },
        );
      } else if (!isAdmin) {
        // No roles at all — only show surveys with no role restriction
        queryBuilder = queryBuilder.andWhere('survey."targetRoles" IS NULL');
      }

      const [surveys, total] = await queryBuilder
        .orderBy(`survey.${sortBy}`, sortOrder)
        .skip(pagination.skip)
        .take(limit)
        .getManyAndCount();

      const result = new PaginatedResponseDto(
        surveys,
        total,
        page,
        limit,
      );

      this.loggerService.log(
        RESPONSE_MESSAGES.SURVEY_LIST_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        { data: result },
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_LIST_SUCCESS,
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
    surveyId: string,
    response: Response,
  ) {
    const apiId = APIID.SURVEY_READ;
    try {
      const survey = await this.getSurveyWithRelations(tenantId, surveyId);

      this.loggerService.log(
        RESPONSE_MESSAGES.SURVEY_READ_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        { data: survey },
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_READ_SUCCESS,
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
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.SURVEY_CANNOT_UPDATE,
          apiId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_CANNOT_UPDATE);
      }

      Object.assign(survey, {
        surveyTitle: dto.survey_title ?? survey.surveyTitle,
        surveyDescription: dto.survey_description ?? survey.surveyDescription,
        surveyType: dto.survey_type ?? survey.surveyType,
        settings: dto.settings ?? survey.settings,
        theme: dto.theme ?? survey.theme,
        targetRoles: dto.target_roles !== undefined ? (dto.target_roles || null) : survey.targetRoles,
        contextType: dto.context_type ?? survey.contextType,
        version: survey.version + 1,
      });

      await this.surveyRepo.save(survey);
      const result = await this.getSurveyWithRelations(tenantId, surveyId);

      this.kafkaService
        .publishSurveyEvent('updated', result, surveyId)
        .catch((err) => 
          this.loggerService.error('Kafka publish failed', err.message, apiId)
        );

      this.loggerService.log(
        RESPONSE_MESSAGES.SURVEY_UPDATE_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        { data: result },
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_UPDATE_SUCCESS,
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
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.SURVEY_CANNOT_PUBLISH,
          apiId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_CANNOT_PUBLISH);
      }

      if (!survey.sections?.length) {
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.SURVEY_NEEDS_SECTION,
          apiId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_NEEDS_SECTION);
      }

      const hasFields = survey.sections.some(
        (s) => s.fields && s.fields.length > 0,
      );
      if (!hasFields) {
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.SURVEY_NEEDS_FIELD,
          apiId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_NEEDS_FIELD);
      }

      survey.status = SurveyStatus.PUBLISHED;
      survey.publishedAt = new Date();
      await this.surveyRepo.save(survey);

      this.kafkaService
        .publishSurveyEvent('published', survey, surveyId)
        .catch((err) => 
          this.loggerService.error('Kafka publish failed', err.message, apiId)
        );

      this.loggerService.log(
        RESPONSE_MESSAGES.SURVEY_PUBLISH_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        { data: survey },
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_PUBLISH_SUCCESS,
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
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.SURVEY_CANNOT_CLOSE,
          apiId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_CANNOT_CLOSE);
      }

      survey.status = SurveyStatus.CLOSED;
      survey.closedAt = new Date();
      await this.surveyRepo.save(survey);

      this.kafkaService
        .publishSurveyEvent('closed', survey, surveyId)
        .catch((err) => 
          this.loggerService.error('Kafka publish failed', err.message, apiId)
        );

      this.loggerService.log(
        RESPONSE_MESSAGES.SURVEY_CLOSE_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        { data: survey },
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_CLOSE_SUCCESS,
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
        this.loggerService.error(
          'BAD_REQUEST',
          RESPONSE_MESSAGES.SURVEY_CANNOT_DELETE,
          apiId,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.SURVEY_CANNOT_DELETE);
      }

      await this.surveyRepo.remove(survey);

      this.kafkaService
        .publishSurveyEvent('deleted', { surveyId, tenantId }, surveyId)
        .catch((err) => 
          this.loggerService.error('Kafka publish failed', err.message, apiId)
        );

      this.loggerService.log(
        RESPONSE_MESSAGES.SURVEY_DELETE_SUCCESS,
        apiId,
      );

      return APIResponse.success(
        response,
        apiId,
        { data: { surveyId } },
        HttpStatus.OK,
        RESPONSE_MESSAGES.SURVEY_DELETE_SUCCESS,
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
        target_roles: original.targetRoles,
        context_type: original.contextType,
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
      const errorMessage = e.message || 'Internal Server Error';
      this.loggerService.error(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        apiId,
        userId,
      );
      return APIResponse.error(
        response,
        apiId,
        errorMessage,
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

    // Populate field options from external data sources
    await this.populateFieldOptions(survey);

    return survey;
  }

  /**
   * Populate options for fields that have external data sources
   */
  private async populateFieldOptions(survey: Survey): Promise<void> {
    if (!survey.sections || survey.sections.length === 0) {
      return;
    }

    const fieldsWithDataSource: Array<{
      fieldId: string;
      dataSource: any;
    }> = [];

    // Collect all fields with data sources
    for (const section of survey.sections) {
      if (section.fields && section.fields.length > 0) {
        for (const field of section.fields) {
          if (field.dataSource) {
            fieldsWithDataSource.push({
              fieldId: field.fieldId,
              dataSource: field.dataSource,
            });
          }
        }
      }
    }

    if (fieldsWithDataSource.length === 0) {
      return;
    }

    // Fetch options for all fields in parallel
    const optionsMap = await this.dataSourceService.fetchMultipleFieldOptions(
      fieldsWithDataSource,
    );

    // Populate the options back to the fields
    for (const section of survey.sections) {
      if (section.fields) {
        for (const field of section.fields) {
          const options = optionsMap.get(field.fieldId);
          if (options) {
            // Add options to the field object (temporary, not persisted)
            (field as any).options = options;
          }
        }
      }
    }
  }
}
