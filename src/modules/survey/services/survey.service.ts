import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Survey, SurveyStatus } from '../entities/survey.entity';
import { SurveySection } from '../entities/survey-section.entity';
import { SurveyField } from '../entities/survey-field.entity';
import { CreateSurveyDto } from '../dto/create-survey.dto';
import { UpdateSurveyDto } from '../dto/update-survey.dto';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '@/common/dto/pagination.dto';

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
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateSurveyDto,
  ): Promise<Survey> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create survey
      const survey = queryRunner.manager.create(Survey, {
        tenant_id: tenantId,
        survey_title: dto.survey_title,
        survey_description: dto.survey_description,
        survey_type: dto.survey_type,
        settings: dto.settings || {},
        theme: dto.theme || {},
        created_by: userId,
        status: SurveyStatus.DRAFT,
      });
      const savedSurvey = await queryRunner.manager.save(survey);

      // Create sections and fields
      if (dto.sections?.length) {
        for (let i = 0; i < dto.sections.length; i++) {
          const sectionDto = dto.sections[i];
          const section = queryRunner.manager.create(SurveySection, {
            survey_id: savedSurvey.survey_id,
            tenant_id: tenantId,
            section_title: sectionDto.section_title,
            section_description: sectionDto.section_description,
            display_order: sectionDto.display_order ?? i,
            is_visible: sectionDto.is_visible ?? true,
            conditional_logic: sectionDto.conditional_logic,
          });
          const savedSection = await queryRunner.manager.save(section);

          if (sectionDto.fields?.length) {
            for (let j = 0; j < sectionDto.fields.length; j++) {
              const fieldDto = sectionDto.fields[j];
              const field = queryRunner.manager.create(SurveyField, {
                section_id: savedSection.section_id,
                survey_id: savedSurvey.survey_id,
                tenant_id: tenantId,
                field_name: fieldDto.field_name,
                field_label: fieldDto.field_label,
                field_type: fieldDto.field_type,
                is_required: fieldDto.is_required ?? false,
                display_order: fieldDto.display_order ?? j,
                placeholder: fieldDto.placeholder,
                help_text: fieldDto.help_text,
                default_value: fieldDto.default_value,
                validations: fieldDto.validations || {},
                data_source: fieldDto.data_source,
                upload_config: fieldDto.upload_config,
                ui_config: fieldDto.ui_config || {},
                conditional_logic: fieldDto.conditional_logic,
              });
              await queryRunner.manager.save(field);
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      // Return full survey with relations
      return this.findOne(tenantId, savedSurvey.survey_id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Survey>> {
    const [surveys, total] = await this.surveyRepo.findAndCount({
      where: { tenant_id: tenantId },
      order: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResponseDto(
      surveys,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(tenantId: string, surveyId: string): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { survey_id: surveyId, tenant_id: tenantId },
      relations: ['sections', 'sections.fields'],
      order: {
        sections: {
          display_order: 'ASC',
          fields: {
            display_order: 'ASC',
          },
        },
      },
    });

    if (!survey) {
      throw new NotFoundException(`Survey ${surveyId} not found`);
    }

    return survey;
  }

  async update(
    tenantId: string,
    surveyId: string,
    dto: UpdateSurveyDto,
  ): Promise<Survey> {
    const survey = await this.findOne(tenantId, surveyId);

    if (
      survey.status === SurveyStatus.CLOSED ||
      survey.status === SurveyStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Cannot update a closed or archived survey',
      );
    }

    // Update basic fields
    Object.assign(survey, {
      survey_title: dto.survey_title ?? survey.survey_title,
      survey_description: dto.survey_description ?? survey.survey_description,
      survey_type: dto.survey_type ?? survey.survey_type,
      settings: dto.settings ?? survey.settings,
      theme: dto.theme ?? survey.theme,
      version: survey.version + 1,
    });

    await this.surveyRepo.save(survey);
    return this.findOne(tenantId, surveyId);
  }

  async publish(tenantId: string, surveyId: string): Promise<Survey> {
    const survey = await this.findOne(tenantId, surveyId);

    if (survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException('Only draft surveys can be published');
    }

    // Validate survey has at least one section with at least one field
    if (!survey.sections?.length) {
      throw new BadRequestException(
        'Survey must have at least one section to publish',
      );
    }

    const hasFields = survey.sections.some(
      (s) => s.fields && s.fields.length > 0,
    );
    if (!hasFields) {
      throw new BadRequestException(
        'Survey must have at least one field to publish',
      );
    }

    survey.status = SurveyStatus.PUBLISHED;
    survey.published_at = new Date();
    await this.surveyRepo.save(survey);

    return survey;
  }

  async close(tenantId: string, surveyId: string): Promise<Survey> {
    const survey = await this.findOne(tenantId, surveyId);

    if (survey.status !== SurveyStatus.PUBLISHED) {
      throw new BadRequestException('Only published surveys can be closed');
    }

    survey.status = SurveyStatus.CLOSED;
    survey.closed_at = new Date();
    await this.surveyRepo.save(survey);

    return survey;
  }

  async delete(tenantId: string, surveyId: string): Promise<void> {
    const survey = await this.findOne(tenantId, surveyId);

    if (survey.status === SurveyStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot delete a published survey. Close it first.',
      );
    }

    await this.surveyRepo.remove(survey);
  }

  async duplicate(
    tenantId: string,
    surveyId: string,
    userId: string,
  ): Promise<Survey> {
    const original = await this.findOne(tenantId, surveyId);

    const dto: CreateSurveyDto = {
      survey_title: `${original.survey_title} (Copy)`,
      survey_description: original.survey_description,
      survey_type: original.survey_type,
      settings: original.settings,
      theme: original.theme,
      sections: original.sections?.map((section) => ({
        section_title: section.section_title,
        section_description: section.section_description,
        display_order: section.display_order,
        is_visible: section.is_visible,
        conditional_logic: section.conditional_logic,
        fields: section.fields?.map((field) => ({
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required,
          display_order: field.display_order,
          placeholder: field.placeholder,
          help_text: field.help_text,
          default_value: field.default_value,
          validations: field.validations,
          data_source: field.data_source,
          upload_config: field.upload_config,
          ui_config: field.ui_config,
          conditional_logic: field.conditional_logic,
        })),
      })),
    };

    return this.create(tenantId, userId, dto);
  }
}
