"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const survey_file_upload_entity_1 = require("./entities/survey-file-upload.entity");
const file_upload_controller_1 = require("./controllers/file-upload.controller");
const file_upload_service_1 = require("./services/file-upload.service");
const image_processing_service_1 = require("./services/image-processing.service");
const video_processing_service_1 = require("./services/video-processing.service");
const virus_scan_service_1 = require("./services/virus-scan.service");
const kafka_module_1 = require("../../kafka/kafka.module");
let FileUploadModule = class FileUploadModule {
};
exports.FileUploadModule = FileUploadModule;
exports.FileUploadModule = FileUploadModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([survey_file_upload_entity_1.SurveyFileUpload]),
            kafka_module_1.KafkaModule,
            platform_express_1.MulterModule.register({
                limits: {
                    fileSize: 100 * 1024 * 1024,
                },
            }),
        ],
        controllers: [file_upload_controller_1.FileUploadController],
        providers: [
            file_upload_service_1.FileUploadService,
            image_processing_service_1.ImageProcessingService,
            video_processing_service_1.VideoProcessingService,
            virus_scan_service_1.VirusScanService,
        ],
        exports: [file_upload_service_1.FileUploadService],
    })
], FileUploadModule);
//# sourceMappingURL=file-upload.module.js.map