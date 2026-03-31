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
exports.ResponseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_service_1 = require("../services/response.service");
const create_response_dto_1 = require("../dto/create-response.dto");
const api_id_config_1 = require("../../../common/utils/api-id.config");
const keycloak_guard_1 = require("../../../common/guards/keycloak.guard");
const exception_filter_1 = require("../../../common/filters/exception.filter");
const tenant_decorator_1 = require("../../../common/decorators/tenant.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let ResponseController = class ResponseController {
    constructor(responseService) {
        this.responseService = responseService;
    }
    async create(request, dto, response, tenantId, userId, surveyId) {
        dto.surveyId = surveyId;
        return this.responseService.create(request, tenantId, userId, dto, response);
    }
    async findAll(request, body, response, tenantId, surveyId) {
        return this.responseService.findAllBySurvey(request, tenantId, surveyId, body, response);
    }
    async getStats(request, response, tenantId, surveyId) {
        return this.responseService.getStats(request, tenantId, surveyId, response);
    }
    async findOne(request, response, tenantId, responseId) {
        return this.responseService.findOne(request, tenantId, responseId, response);
    }
    async update(request, response, tenantId, responseId, userId, dto) {
        return this.responseService.update(request, tenantId, responseId, userId, dto, response);
    }
    async submit(request, response, tenantId, responseId, userId, dto) {
        return this.responseService.submit(request, tenantId, responseId, userId, dto, response);
    }
};
exports.ResponseController = ResponseController;
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.RESPONSE_CREATE)),
    (0, common_1.Post)('create/:surveyId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Response started successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, tenant_decorator_1.GetTenantId)()),
    __param(4, (0, current_user_decorator_1.GetUserId)()),
    __param(5, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_response_dto_1.CreateResponseDto, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ResponseController.prototype, "create", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.RESPONSE_LIST)),
    (0, common_1.Post)('list/:surveyId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Responses fetched successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, tenant_decorator_1.GetTenantId)()),
    __param(4, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ResponseController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.RESPONSE_STATS)),
    (0, common_1.Get)('stats/:surveyId'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Response statistics fetched successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ResponseController.prototype, "getStats", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.RESPONSE_READ)),
    (0, common_1.Get)('read/:responseId'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Response fetched successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('responseId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ResponseController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.RESPONSE_UPDATE)),
    (0, common_1.Put)('update/:responseId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Response updated successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('responseId', common_1.ParseUUIDPipe)),
    __param(4, (0, current_user_decorator_1.GetUserId)()),
    __param(5, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, create_response_dto_1.UpdateResponseDto]),
    __metadata("design:returntype", Promise)
], ResponseController.prototype, "update", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.RESPONSE_SUBMIT)),
    (0, common_1.Post)('submit/:responseId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Response submitted successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('responseId', common_1.ParseUUIDPipe)),
    __param(4, (0, current_user_decorator_1.GetUserId)()),
    __param(5, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, create_response_dto_1.SubmitResponseDto]),
    __metadata("design:returntype", Promise)
], ResponseController.prototype, "submit", null);
exports.ResponseController = ResponseController = __decorate([
    (0, swagger_1.ApiTags)('survey-responses'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('responses'),
    (0, common_1.UseGuards)(keycloak_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [response_service_1.ResponseService])
], ResponseController);
//# sourceMappingURL=response.controller.js.map