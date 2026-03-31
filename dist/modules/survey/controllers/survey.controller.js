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
exports.SurveyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const survey_service_1 = require("../services/survey.service");
const create_survey_dto_1 = require("../dto/create-survey.dto");
const update_survey_dto_1 = require("../dto/update-survey.dto");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const api_id_config_1 = require("../../../common/utils/api-id.config");
const keycloak_guard_1 = require("../../../common/guards/keycloak.guard");
const exception_filter_1 = require("../../../common/filters/exception.filter");
const tenant_decorator_1 = require("../../../common/decorators/tenant.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
let SurveyController = class SurveyController {
    constructor(surveyService) {
        this.surveyService = surveyService;
    }
    async create(request, dto, response, tenantId, userId) {
        return this.surveyService.create(request, tenantId, userId, dto, response);
    }
    async findAll(request, pagination, response, tenantId, userRoles) {
        return this.surveyService.findAll(request, tenantId, pagination, userRoles, response);
    }
    async findOne(request, response, tenantId, surveyId) {
        return this.surveyService.findOne(request, tenantId, surveyId, response);
    }
    async update(request, response, tenantId, surveyId, dto) {
        return this.surveyService.update(request, tenantId, surveyId, dto, response);
    }
    async publish(request, response, tenantId, surveyId) {
        return this.surveyService.publish(request, tenantId, surveyId, response);
    }
    async close(request, response, tenantId, surveyId) {
        return this.surveyService.close(request, tenantId, surveyId, response);
    }
    async duplicate(request, response, tenantId, surveyId, userId) {
        return this.surveyService.duplicate(request, tenantId, surveyId, userId, response);
    }
    async delete(request, response, tenantId, surveyId) {
        return this.surveyService.delete(request, tenantId, surveyId, response);
    }
};
exports.SurveyController = SurveyController;
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.SURVEY_CREATE)),
    (0, common_1.Post)('create'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Survey created successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, tenant_decorator_1.GetTenantId)()),
    __param(4, (0, current_user_decorator_1.GetUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_survey_dto_1.CreateSurveyDto, Object, String, String]),
    __metadata("design:returntype", Promise)
], SurveyController.prototype, "create", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.SURVEY_LIST)),
    (0, common_1.Post)('list'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Surveys fetched successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, tenant_decorator_1.GetTenantId)()),
    __param(4, (0, roles_decorator_1.GetUserRoles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationDto, Object, String, Array]),
    __metadata("design:returntype", Promise)
], SurveyController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.SURVEY_READ)),
    (0, common_1.Get)('read/:surveyId'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Survey fetched successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SurveyController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.SURVEY_UPDATE)),
    (0, common_1.Put)('update/:surveyId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Survey updated successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, update_survey_dto_1.UpdateSurveyDto]),
    __metadata("design:returntype", Promise)
], SurveyController.prototype, "update", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.SURVEY_PUBLISH)),
    (0, common_1.Post)(':surveyId/publish'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Survey published successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SurveyController.prototype, "publish", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.SURVEY_CLOSE)),
    (0, common_1.Post)(':surveyId/close'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Survey closed successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SurveyController.prototype, "close", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.SURVEY_DUPLICATE)),
    (0, common_1.Post)(':surveyId/duplicate'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Survey duplicated successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __param(4, (0, current_user_decorator_1.GetUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], SurveyController.prototype, "duplicate", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.SURVEY_DELETE)),
    (0, common_1.Delete)('delete/:surveyId'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Survey deleted successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SurveyController.prototype, "delete", null);
exports.SurveyController = SurveyController = __decorate([
    (0, swagger_1.ApiTags)('surveys'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('surveys'),
    (0, common_1.UseGuards)(keycloak_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [survey_service_1.SurveyService])
], SurveyController);
//# sourceMappingURL=survey.controller.js.map