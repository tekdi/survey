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
exports.FileUploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const file_upload_service_1 = require("../services/file-upload.service");
const upload_file_dto_1 = require("../dto/upload-file.dto");
const api_id_config_1 = require("../../../common/utils/api-id.config");
const keycloak_guard_1 = require("../../../common/guards/keycloak.guard");
const exception_filter_1 = require("../../../common/filters/exception.filter");
const tenant_decorator_1 = require("../../../common/decorators/tenant.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let FileUploadController = class FileUploadController {
    constructor(fileUploadService) {
        this.fileUploadService = fileUploadService;
    }
    async uploadFile(request, response, tenantId, surveyId, userId, file, uploadFileDto) {
        return this.fileUploadService.uploadFile(request, {
            tenantId,
            surveyId,
            responseId: uploadFileDto.responseId ?? '',
            fieldId: uploadFileDto.fieldId ?? '',
            file,
            uploadedBy: userId,
        }, response);
    }
    async getFile(request, response, tenantId, surveyId, fileId) {
        return this.fileUploadService.getFile(request, tenantId, surveyId, fileId, response);
    }
    async getFileUrl(request, response, tenantId, surveyId, fileId) {
        return this.fileUploadService.getFileAccessUrl(request, tenantId, surveyId, fileId, response);
    }
    async deleteFile(request, response, tenantId, surveyId, fileId, userId) {
        return this.fileUploadService.deleteFile(request, tenantId, surveyId, fileId, userId, response);
    }
};
exports.FileUploadController = FileUploadController;
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.FILE_UPLOAD)),
    (0, common_1.Post)('upload/:surveyId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiCreatedResponse)({ description: 'File uploaded successfully' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 100 * 1024 * 1024 },
    })),
    (0, throttler_1.Throttle)({ default: { limit: 50, ttl: 60000 } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __param(4, (0, current_user_decorator_1.GetUserId)()),
    __param(5, (0, common_1.UploadedFile)()),
    __param(6, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, Object, upload_file_dto_1.UploadFileDto]),
    __metadata("design:returntype", Promise)
], FileUploadController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.FILE_READ)),
    (0, common_1.Get)('read/:surveyId/:fileId'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'File details fetched successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __param(4, (0, common_1.Param)('fileId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], FileUploadController.prototype, "getFile", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.FILE_URL)),
    (0, common_1.Get)('url/:surveyId/:fileId'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'File URL generated successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __param(4, (0, common_1.Param)('fileId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], FileUploadController.prototype, "getFileUrl", null);
__decorate([
    (0, common_1.UseFilters)(new exception_filter_1.AllExceptionsFilter(api_id_config_1.APIID.FILE_DELETE)),
    (0, common_1.Delete)('delete/:surveyId/:fileId'),
    (0, swagger_1.ApiHeader)({ name: 'tenantid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'File deleted successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Param)('surveyId', common_1.ParseUUIDPipe)),
    __param(4, (0, common_1.Param)('fileId', common_1.ParseUUIDPipe)),
    __param(5, (0, current_user_decorator_1.GetUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FileUploadController.prototype, "deleteFile", null);
exports.FileUploadController = FileUploadController = __decorate([
    (0, swagger_1.ApiTags)('file-upload'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(keycloak_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [file_upload_service_1.FileUploadService])
], FileUploadController);
//# sourceMappingURL=file-upload.controller.js.map