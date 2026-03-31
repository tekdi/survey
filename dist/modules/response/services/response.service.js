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
exports.ResponseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const survey_response_entity_1 = require("../entities/survey-response.entity");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const api_response_1 = require("../../../common/responses/api-response");
const api_id_config_1 = require("../../../common/utils/api-id.config");
const response_messages_1 = require("../../../common/utils/response-messages");
const survey_service_1 = require("../../survey/services/survey.service");
const survey_entity_1 = require("../../survey/entities/survey.entity");
const kafka_service_1 = require("../../../kafka/kafka.service");
const logger_service_1 = require("../../../common/logger/logger.service");
let ResponseService = class ResponseService {
    constructor(responseRepo, surveyService, kafkaService, loggerService) {
        this.responseRepo = responseRepo;
        this.surveyService = surveyService;
        this.kafkaService = kafkaService;
        this.loggerService = loggerService;
    }
    async create(request, tenantId, userId, dto, response) {
        const apiId = api_id_config_1.APIID.RESPONSE_CREATE;
        try {
            const survey = await this.surveyService.getSurveyWithRelations(tenantId, dto.surveyId);
            if (survey.status !== survey_entity_1.SurveyStatus.PUBLISHED) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.RESPONSE_NOT_ACCEPTING, apiId, userId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.RESPONSE_NOT_ACCEPTING);
            }
            const requiresContext = survey.contextType &&
                survey.contextType !== survey_entity_1.SurveyContextType.NONE &&
                survey.contextType !== survey_entity_1.SurveyContextType.SELF;
            if (requiresContext && !dto.contextId) {
                throw new common_1.BadRequestException(`This survey requires a contextId (context_type: ${survey.contextType}). Please provide the ID of the ${survey.contextType} this response is for.`);
            }
            if (!survey.settings?.allowMultipleSubmissions) {
                const duplicateWhere = {
                    tenantId,
                    surveyId: dto.surveyId,
                    respondentId: userId,
                    status: survey_response_entity_1.ResponseStatus.SUBMITTED,
                };
                if (requiresContext && dto.contextId) {
                    duplicateWhere.contextId = dto.contextId;
                }
                const existing = await this.responseRepo.findOne({
                    where: duplicateWhere,
                });
                if (existing) {
                    this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.RESPONSE_DUPLICATE_SUBMISSION, apiId, userId);
                    throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.RESPONSE_DUPLICATE_SUBMISSION);
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
                status: survey_response_entity_1.ResponseStatus.IN_PROGRESS,
                createdBy: userId,
                updatedBy: userId,
            });
            const saved = await this.responseRepo.save(surveyResponse);
            this.kafkaService
                .publishResponseEvent('started', {
                responseId: saved.responseId,
                surveyId: saved.surveyId,
                tenantId: saved.tenantId,
                respondentId: saved.respondentId,
                status: saved.status,
            }, saved.responseId)
                .catch((err) => this.loggerService.error('Kafka publish failed', err.message, apiId, userId));
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.RESPONSE_CREATE_SUCCESS, apiId, userId);
            return api_response_1.APIResponse.success(response, apiId, { data: saved }, common_1.HttpStatus.CREATED, response_messages_1.RESPONSE_MESSAGES.RESPONSE_CREATE_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId, userId);
            const status = e instanceof common_1.BadRequestException
                ? common_1.HttpStatus.BAD_REQUEST
                : e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name || 'BAD_REQUEST', status);
        }
    }
    async findAllBySurvey(request, tenantId, surveyId, pagination, response) {
        const apiId = api_id_config_1.APIID.RESPONSE_LIST;
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
            const result = new pagination_dto_1.PaginatedResponseDto(responses, total, page, limit);
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.RESPONSE_LIST_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: result }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.RESPONSE_LIST_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name || 'Internal Server Error', e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(request, tenantId, responseId, response) {
        const apiId = api_id_config_1.APIID.RESPONSE_READ;
        try {
            const surveyResponse = await this.getResponseById(tenantId, responseId);
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.RESPONSE_READ_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: surveyResponse }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.RESPONSE_READ_SUCCESS);
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
    async update(request, tenantId, responseId, userId, dto, response) {
        const apiId = api_id_config_1.APIID.RESPONSE_UPDATE;
        try {
            const surveyResponse = await this.getResponseById(tenantId, responseId);
            if (surveyResponse.status === survey_response_entity_1.ResponseStatus.SUBMITTED) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.RESPONSE_CANNOT_UPDATE, apiId, userId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.RESPONSE_CANNOT_UPDATE);
            }
            if (surveyResponse.respondentId !== userId) {
                this.loggerService.error('FORBIDDEN', 'You can only update your own response', apiId, userId);
                throw new common_1.ForbiddenException('You can only update your own response');
            }
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
            this.kafkaService
                .publishResponseEvent('updated', {
                responseId: saved.responseId,
                surveyId: saved.surveyId,
                tenantId: saved.tenantId,
                status: saved.status,
            }, saved.responseId)
                .catch((err) => this.loggerService.error('Kafka publish failed', err.message, apiId, userId));
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.RESPONSE_UPDATE_SUCCESS, apiId, userId);
            return api_response_1.APIResponse.success(response, apiId, { data: saved }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.RESPONSE_UPDATE_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId, userId);
            const status = e instanceof common_1.BadRequestException
                ? common_1.HttpStatus.BAD_REQUEST
                : e instanceof common_1.ForbiddenException
                    ? common_1.HttpStatus.FORBIDDEN
                    : e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name, status);
        }
    }
    async submit(request, tenantId, responseId, userId, dto, response) {
        const apiId = api_id_config_1.APIID.RESPONSE_SUBMIT;
        try {
            const surveyResponse = await this.getResponseById(tenantId, responseId);
            if (surveyResponse.status === survey_response_entity_1.ResponseStatus.SUBMITTED) {
                this.loggerService.error('BAD_REQUEST', response_messages_1.RESPONSE_MESSAGES.RESPONSE_ALREADY_SUBMITTED, apiId, userId);
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.RESPONSE_ALREADY_SUBMITTED);
            }
            if (surveyResponse.respondentId !== userId) {
                this.loggerService.error('FORBIDDEN', 'You can only submit your own response', apiId, userId);
                throw new common_1.ForbiddenException('You can only submit your own response');
            }
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
            const survey = await this.surveyService.getSurveyWithRelations(tenantId, surveyResponse.surveyId);
            this.validateRequiredFields(survey, surveyResponse);
            surveyResponse.status = survey_response_entity_1.ResponseStatus.SUBMITTED;
            surveyResponse.submittedAt = new Date();
            surveyResponse.updatedBy = userId;
            surveyResponse.responseMetadata = {
                ...surveyResponse.responseMetadata,
                completedAt: new Date().toISOString(),
                timeSpentSeconds: this.calculateTimeSpent(surveyResponse),
            };
            const saved = await this.responseRepo.save(surveyResponse);
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
                .catch((err) => this.loggerService.error('Kafka publish failed', err.message, apiId, userId));
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.RESPONSE_SUBMIT_SUCCESS, apiId, userId);
            return api_response_1.APIResponse.success(response, apiId, { data: saved }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.RESPONSE_SUBMIT_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId, userId);
            const status = e instanceof common_1.BadRequestException
                ? common_1.HttpStatus.BAD_REQUEST
                : e instanceof common_1.ForbiddenException
                    ? common_1.HttpStatus.FORBIDDEN
                    : e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name, status);
        }
    }
    async getStats(request, tenantId, surveyId, response) {
        const apiId = api_id_config_1.APIID.RESPONSE_STATS;
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
                submitted: survey_response_entity_1.ResponseStatus.SUBMITTED,
                inProgress: survey_response_entity_1.ResponseStatus.IN_PROGRESS,
            })
                .getRawOne();
            const result = {
                totalResponses: parseInt(stats.totalResponses, 10),
                submittedResponses: parseInt(stats.submittedResponses, 10),
                inProgressResponses: parseInt(stats.inProgressResponses, 10),
                averageTimeSpent: 0,
            };
            this.loggerService.log(response_messages_1.RESPONSE_MESSAGES.RESPONSE_STATS_SUCCESS, apiId);
            return api_response_1.APIResponse.success(response, apiId, { data: result }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.RESPONSE_STATS_SUCCESS);
        }
        catch (e) {
            const errorMessage = e.message || 'Internal Server Error';
            this.loggerService.error('INTERNAL_SERVER_ERROR', errorMessage, apiId);
            return api_response_1.APIResponse.error(response, apiId, errorMessage, e.name || 'Internal Server Error', e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getResponseById(tenantId, responseId) {
        const surveyResponse = await this.responseRepo.findOne({
            where: { responseId, tenantId },
        });
        if (!surveyResponse) {
            throw new common_1.NotFoundException(response_messages_1.RESPONSE_MESSAGES.RESPONSE_NOT_FOUND);
        }
        return surveyResponse;
    }
    validateRequiredFields(survey, surveyResponse) {
        const errors = [];
        for (const section of survey.sections || []) {
            for (const field of section.fields || []) {
                if (field.isRequired) {
                    const value = surveyResponse.responseData[field.fieldId];
                    const fileIds = surveyResponse.fileUploadIds[field.fieldId];
                    const isUploadField = ['image_upload', 'video_upload', 'file_upload'].includes(field.fieldType);
                    if (isUploadField) {
                        if (!fileIds || fileIds.length === 0) {
                            errors.push(`${field.fieldLabel} is required`);
                        }
                    }
                    else if (value === undefined || value === null || value === '') {
                        errors.push(`${field.fieldLabel} is required`);
                    }
                }
            }
        }
        if (errors.length > 0) {
            throw new common_1.BadRequestException({
                message: response_messages_1.RESPONSE_MESSAGES.RESPONSE_VALIDATION_FAILED,
                errors,
            });
        }
    }
    calculateTimeSpent(surveyResponse) {
        const startedAt = surveyResponse.responseMetadata?.startedAt;
        if (!startedAt)
            return 0;
        const start = new Date(startedAt).getTime();
        const end = Date.now();
        return Math.round((end - start) / 1000);
    }
};
exports.ResponseService = ResponseService;
exports.ResponseService = ResponseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(survey_response_entity_1.SurveyResponse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        survey_service_1.SurveyService,
        kafka_service_1.KafkaService,
        logger_service_1.LoggerService])
], ResponseService);
//# sourceMappingURL=response.service.js.map