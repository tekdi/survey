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
var FileUploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const survey_file_upload_entity_1 = require("../entities/survey-file-upload.entity");
const storage_service_1 = require("../../storage/services/storage.service");
const image_processing_service_1 = require("./image-processing.service");
const video_processing_service_1 = require("./video-processing.service");
const virus_scan_service_1 = require("./virus-scan.service");
const api_response_1 = require("../../../common/responses/api-response");
const api_id_config_1 = require("../../../common/utils/api-id.config");
const response_messages_1 = require("../../../common/utils/response-messages");
const kafka_service_1 = require("../../../kafka/kafka.service");
let FileUploadService = FileUploadService_1 = class FileUploadService {
    constructor(fileRepo, storageService, imageProcessing, videoProcessing, virusScan, kafkaService) {
        this.fileRepo = fileRepo;
        this.storageService = storageService;
        this.imageProcessing = imageProcessing;
        this.videoProcessing = videoProcessing;
        this.virusScan = virusScan;
        this.kafkaService = kafkaService;
        this.logger = new common_1.Logger(FileUploadService_1.name);
    }
    async uploadFile(request, options, response) {
        const apiId = api_id_config_1.APIID.FILE_UPLOAD;
        try {
            const { tenantId, surveyId, responseId, fieldId, file, uploadedBy } = options;
            if (!file) {
                throw new common_1.BadRequestException(response_messages_1.RESPONSE_MESSAGES.FILE_REQUIRED);
            }
            const storageInfo = await this.storageService.uploadFile({
                tenantId,
                surveyId,
                responseId,
                fieldId,
                file,
            });
            const fileRecord = this.fileRepo.create({
                tenantId,
                surveyId,
                responseId,
                fieldId,
                originalFilename: file.originalname,
                storedFilename: storageInfo.storedFilename,
                filePath: storageInfo.filePath,
                fileSize: storageInfo.fileSize,
                mimeType: storageInfo.mimeType,
                fileType: storageInfo.fileType,
                status: 'completed',
                uploadedBy,
            });
            await this.fileRepo.save(fileRecord);
            if (storageInfo.fileType === 'image') {
                this.extractImageMetadata(fileRecord, file.buffer).catch((err) => {
                    this.logger.warn(`Image metadata extraction failed: ${err.message}`);
                });
            }
            this.kafkaService
                .publishFileEvent('uploaded', {
                fileId: fileRecord.fileId,
                surveyId: fileRecord.surveyId,
                tenantId: fileRecord.tenantId,
                fieldId: fileRecord.fieldId,
                fileType: fileRecord.fileType,
            }, fileRecord.fileId)
                .catch((err) => this.logger.warn('Kafka publish failed', err.message));
            const result = {
                fileId: fileRecord.fileId,
                filename: fileRecord.originalFilename,
                fileSize: fileRecord.fileSize,
                fileType: fileRecord.fileType,
                status: fileRecord.status,
                filePath: fileRecord.filePath,
            };
            return api_response_1.APIResponse.success(response, apiId, result, common_1.HttpStatus.CREATED, response_messages_1.RESPONSE_MESSAGES.FILE_UPLOAD_SUCCESS);
        }
        catch (e) {
            this.logger.error(`File upload failed: ${e.message}`, e.stack);
            const status = e instanceof common_1.BadRequestException
                ? common_1.HttpStatus.BAD_REQUEST
                : e instanceof common_1.ForbiddenException
                    ? common_1.HttpStatus.FORBIDDEN
                    : e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return api_response_1.APIResponse.error(response, apiId, e.message, e.name || 'Error', status);
        }
    }
    async getFile(request, tenantId, surveyId, fileId, response) {
        const apiId = api_id_config_1.APIID.FILE_READ;
        try {
            const file = await this.fileRepo.findOne({
                where: { fileId, tenantId, surveyId },
            });
            if (!file || file.deletedAt) {
                throw new common_1.NotFoundException(response_messages_1.RESPONSE_MESSAGES.FILE_NOT_FOUND);
            }
            const accessUrl = await this.storageService.getPresignedUrl(file.filePath);
            const result = {
                fileId: file.fileId,
                filename: file.originalFilename,
                fileSize: file.fileSize,
                fileType: file.fileType,
                mimeType: file.mimeType,
                status: file.status,
                accessUrl,
                thumbnailUrl: file.imageThumbnailPath || file.videoThumbnailPath,
                metadata: this.buildMetadata(file),
                createdAt: file.createdAt,
            };
            return api_response_1.APIResponse.success(response, apiId, result, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.FILE_READ_SUCCESS);
        }
        catch (e) {
            this.logger.error(`File read failed: ${e.message}`, e.stack);
            const status = e instanceof common_1.NotFoundException
                ? common_1.HttpStatus.NOT_FOUND
                : e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return api_response_1.APIResponse.error(response, apiId, e.message, e.name, status);
        }
    }
    async getFileAccessUrl(request, tenantId, surveyId, fileId, response) {
        const apiId = api_id_config_1.APIID.FILE_URL;
        try {
            const file = await this.fileRepo.findOne({
                where: { fileId, tenantId, surveyId },
            });
            if (!file || file.deletedAt) {
                throw new common_1.NotFoundException(response_messages_1.RESPONSE_MESSAGES.FILE_NOT_FOUND);
            }
            const accessUrl = await this.storageService.getPresignedUrl(file.filePath);
            const result = {
                url: accessUrl,
                expiresAt: new Date(Date.now() + 3600 * 1000),
            };
            return api_response_1.APIResponse.success(response, apiId, result, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.FILE_URL_SUCCESS);
        }
        catch (e) {
            this.logger.error(`File URL generation failed: ${e.message}`, e.stack);
            const status = e instanceof common_1.NotFoundException
                ? common_1.HttpStatus.NOT_FOUND
                : e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return api_response_1.APIResponse.error(response, apiId, e.message, e.name, status);
        }
    }
    async deleteFile(request, tenantId, surveyId, fileId, userId, response) {
        const apiId = api_id_config_1.APIID.FILE_DELETE;
        try {
            const file = await this.fileRepo.findOne({
                where: { fileId, tenantId, surveyId },
            });
            if (!file) {
                throw new common_1.NotFoundException(response_messages_1.RESPONSE_MESSAGES.FILE_NOT_FOUND);
            }
            file.deletedAt = new Date();
            file.status = 'deleted';
            file.updatedBy = userId;
            await this.fileRepo.save(file);
            this.kafkaService
                .publishFileEvent('deleted', {
                fileId: file.fileId,
                surveyId: file.surveyId,
                tenantId: file.tenantId,
            }, file.fileId)
                .catch((err) => this.logger.error('Kafka publish failed', err.stack));
            return api_response_1.APIResponse.success(response, apiId, { fileId }, common_1.HttpStatus.OK, response_messages_1.RESPONSE_MESSAGES.FILE_DELETE_SUCCESS);
        }
        catch (e) {
            this.logger.error(`File delete failed: ${e.message}`, e.stack);
            const status = e instanceof common_1.NotFoundException
                ? common_1.HttpStatus.NOT_FOUND
                : e.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return api_response_1.APIResponse.error(response, apiId, e.message, e.name, status);
        }
    }
    async extractImageMetadata(fileRecord, buffer) {
        try {
            const result = await this.imageProcessing.processImage(fileRecord.filePath, buffer);
            fileRecord.imageWidth = result.width;
            fileRecord.imageHeight = result.height;
            fileRecord.imageThumbnailPath = result.thumbnailPath || null;
            await this.fileRepo.save(fileRecord);
        }
        catch (error) {
            this.logger.warn(`Image metadata extraction failed: ${error.message}`);
        }
    }
    buildMetadata(file) {
        if (file.fileType === 'image') {
            return {
                width: file.imageWidth,
                height: file.imageHeight,
            };
        }
        return {
            duration: file.videoDuration,
        };
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = FileUploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(survey_file_upload_entity_1.SurveyFileUpload)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        storage_service_1.StorageService,
        image_processing_service_1.ImageProcessingService,
        video_processing_service_1.VideoProcessingService,
        virus_scan_service_1.VirusScanService,
        kafka_service_1.KafkaService])
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map