"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const survey_entity_1 = require("../entities/survey.entity");
const survey_section_entity_1 = require("../entities/survey-section.entity");
const survey_field_entity_1 = require("../entities/survey-field.entity");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const api_response_1 = require("../../../common/responses/api-response");
const api_id_config_1 = require("../../../common/utils/api-id.config");
const response_messages_1 = require("../../../common/utils/response-messages");
const kafka_service_1 = require("../../../kafka/kafka.service");
const logger_service_1 = require("../../../common/logger/logger.service");
const data_source_service_1 = require("./data-source.service");
let SurveyService = class SurveyService {
    constructor(surveyRepo, sectionRepo, fieldRepo, dataSource, kafkaService, loggerService, dataSourceService) {
        this.surveyRepo = surveyRepo;
        this.sectionRepo = sectionRepo;
        this.fieldRepo = fieldRepo;
        this.dataSource = dataSource;
        this.kafkaService = kafkaService;
        this.loggerService = loggerService;
        this.dataSourceService = dataSourceService;
    }
    async create(request, tenantId, userId, dto, response) {
        const apiId = api_id_config_1.APIID.SURVEY_CREATE;
        try {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                const survey = queryRunner.manager.create(survey_entity_1.Survey, {
                    tenantId,
                    surveyTitle: dto.survey_title,
                    surveyDescription: dto.survey_description,
                    surveyType: dto.survey_type,
                    settings: dto.settings || {},
                    theme: dto.theme || {},
                    targetRoles: dto.target_roles || null,
                    contextType: dto.context_type || survey_entity_1.SurveyContextType.NONE,
                    createdBy: userId,
                    updatedBy: userId,
                    status: survey_entity_1.SurveyStatus.DRAFT,
                });
                const savedSurvey = await queryRunner.manager.save(survey);
                if (dto.sections?.length) {
                    for (let i = 0; i < dto.sections.length; i++) {
                        const sectionDto = dto.sections[i];
                        const section = queryRunner.manager.create(survey_section_entity_1.SurveySection, {
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
                                const field = queryRunner.manager.create(survey_field_entity_1.SurveyField, {
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
                this.kafkaService
                    .publishSurveyEvent('created', result, savedSurvey.surveyId)
                    .catch((err) => this.loggerService.error('Kafka publish failed', err.message, apiId, userId));
                this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.SURVEY_CREATE_SUCCESS, apiId, userId);
                return api_response_1.APIResponse.success(response, apiId, { data: result }, common_1.HttpStatus.CREATED, response_messages_1.RESPONSE_MESSAGES.SURVEY_CREATE_SUCCESS);
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
            finally {
                await queryRunner.release();
            }
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId, userId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name || 'BAD_REQUEST', e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(request, tenantId, pagination, userRoles, response) {
        const apiId = api_id_config_1.APIID.SURVEY_LIST;
        try {
            const sortBy = pagination.sortBy || 'createdAt';
            const sortOrder = pagination.sortOrder || 'DESC';
            const page = pagination.page || 1;
            const limit = pagination.limit || 20;
            const isAdmin = userRoles.includes('admin');
            let queryBuilder = this.surveyRepo
                .createQueryBuilder('survey')
                .where('survey.tenantId = :tenantId', { tenantId });
            if (!isAdmin && userRoles.length > 0) {
                queryBuilder = queryBuilder.andWhere('(survey."targetRoles" IS NULL OR survey."targetRoles" ??| ARRAY[:...userRoles])', { userRoles });
            }
            else if (!isAdmin) {
                queryBuilder = queryBuilder.andWhere('survey."targetRoles" IS NULL');
            }
            const [surveys, total] = await queryBuilder
                .orderBy(`survey.${sortBy}`, sortOrder)
                .skip(pagination.skip)
                .take(limit)
                .getManyAndCount();
            const result = new pagination_dto_1.PaginatedResponseDto(surveys, total, page, limit);
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.SURVEY_LIST_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: result }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.SURVEY_LIST_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name || 'Internal Server Error', e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(request, tenantId, surveyId, response) {
        const apiId = api_id_config_1.APIID.SURVEY_READ;
        try {
            const survey = await this.getSurveyWithRelations(tenantId, surveyId);
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.SURVEY_READ_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: survey }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.SURVEY_READ_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId);
            const status = e instanceof common_1.NotFoundException
                ? common_1.HttpStatus.NOT_FOUND
                : e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name, status);
        }
    }
    async update(request, tenantId, surveyId, dto, response) {
        const apiId = api_id_config_1.APIID.SURVEY_UPDATE;
        try {
            const survey = await this.getSurveyWithRelations(tenantId, surveyId);
            if (survey.status === survey_entity_1.SurveyStatus.CLOSED ||
                survey.status === survey_entity_1.SurveyStatus.ARCHIVED) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.SURVEY_CANNOT_UPDATE, apiId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.SURVEY_CANNOT_UPDATE);
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
                .catch((err) => this.loggerService.error('Kafka publish failed', err.message, apiId));
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.SURVEY_UPDATE_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: result }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.SURVEY_UPDATE_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name, e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async publish(request, tenantId, surveyId, response) {
        const apiId = api_id_config_1.APIID.SURVEY_PUBLISH;
        try {
            const survey = await this.getSurveyWithRelations(tenantId, surveyId);
            if (survey.status !== survey_entity_1.SurveyStatus.DRAFT) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.SURVEY_CANNOT_PUBLISH, apiId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.SURVEY_CANNOT_PUBLISH);
            }
            if (!survey.sections?.length) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.SURVEY_NEEDS_SECTION, apiId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.SURVEY_NEEDS_SECTION);
            }
            const hasFields = survey.sections.some((s) => s.fields && s.fields.length > 0);
            if (!hasFields) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.SURVEY_NEEDS_FIELD, apiId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.SURVEY_NEEDS_FIELD);
            }
            survey.status = survey_entity_1.SurveyStatus.PUBLISHED;
            survey.publishedAt = new Date();
            await this.surveyRepo.save(survey);
            this.kafkaService
                .publishSurveyEvent('published', survey, surveyId)
                .catch((err) => this.loggerService.error('Kafka publish failed', err.message, apiId));
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.SURVEY_PUBLISH_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: survey }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.SURVEY_PUBLISH_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name, e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async close(request, tenantId, surveyId, response) {
        const apiId = api_id_config_1.APIID.SURVEY_CLOSE;
        try {
            const survey = await this.getSurveyWithRelations(tenantId, surveyId);
            if (survey.status !== survey_entity_1.SurveyStatus.PUBLISHED) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.SURVEY_CANNOT_CLOSE, apiId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.SURVEY_CANNOT_CLOSE);
            }
            survey.status = survey_entity_1.SurveyStatus.CLOSED;
            survey.closedAt = new Date();
            await this.surveyRepo.save(survey);
            this.kafkaService
                .publishSurveyEvent('closed', survey, surveyId)
                .catch((err) => this.loggerService.error('Kafka publish failed', err.message, apiId));
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.SURVEY_CLOSE_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: survey }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.SURVEY_CLOSE_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name, e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async delete(request, tenantId, surveyId, response) {
        const apiId = api_id_config_1.APIID.SURVEY_DELETE;
        try {
            const survey = await this.getSurveyWithRelations(tenantId, surveyId);
            if (survey.status === survey_entity_1.SurveyStatus.PUBLISHED) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.SURVEY_CANNOT_DELETE, apiId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.SURVEY_CANNOT_DELETE);
            }
            await this.surveyRepo.remove(survey);
            this.kafkaService
                .publishSurveyEvent('deleted', { surveyId, tenantId }, surveyId)
                .catch((err) => this.loggerService.error('Kafka publish failed', err.message, apiId));
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.SURVEY_DELETE_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: { surveyId } }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.SURVEY_DELETE_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name, e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async duplicate(request, tenantId, surveyId, userId, response) {
        const apiId = api_id_config_1.APIID.SURVEY_DUPLICATE;
        try {
            const original = await this.getSurveyWithRelations(tenantId, surveyId);
            const dto = {
                survey_title: `${original.surveyTitle} (Copy)`,
                survey_description: original.surveyDescription,
                survey_type: original.surveyType,
                settings: original.settings,
                theme: original.theme,
                target_roles: original.targetRoles ?? undefined,
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
            return this.create(request, tenantId, userId, dto, response);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId, userId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name, e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSurveyWithRelations(tenantId, surveyId) {
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
            throw new common_1.NotFoundException(response_messages_1.RESPONSE_MESSAGES.SURVEY_NOT_FOUND);
        }
        await this.populateFieldOptions(survey);
        return survey;
    }
    async populateFieldOptions(survey) {
        if (!survey.sections || survey.sections.length === 0) {
            return;
        }
        const fieldsWithDataSource = [];
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
        const optionsMap = await this.dataSourceService.fetchMultipleFieldOptions(fieldsWithDataSource);
        for (const section of survey.sections) {
            if (section.fields) {
                for (const field of section.fields) {
                    const options = optionsMap.get(field.fieldId);
                    if (options) {
                        field.options = options;
                    }
                }
            }
        }
    }
};
exports.SurveyService = SurveyService;
exports.SurveyService = SurveyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(survey_entity_1.Survey)),
    __param(1, (0, typeorm_1.InjectRepository)(survey_section_entity_1.SurveySection)),
    __param(2, (0, typeorm_1.InjectRepository)(survey_field_entity_1.SurveyField)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        kafka_service_1.KafkaService,
        logger_service_1.LoggerService,
        data_source_service_1.DataSourceService])
], SurveyService);
//# sourceMappingURL=survey.service.js.map