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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyFileUpload = void 0;
const typeorm_1 = require("typeorm");
let SurveyFileUpload = class SurveyFileUpload {
};
exports.SurveyFileUpload = SurveyFileUpload;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'fileId' }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "fileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenantId', type: 'uuid' }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'surveyId', type: 'uuid' }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "surveyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responseId', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "responseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fieldId', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "fieldId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'originalFilename', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "originalFilename", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'storedFilename', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "storedFilename", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'filePath', type: 'text' }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fileSize', type: 'bigint' }),
    __metadata("design:type", Number)
], SurveyFileUpload.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mimeType', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fileType', type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imageWidth', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], SurveyFileUpload.prototype, "imageWidth", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imageHeight', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], SurveyFileUpload.prototype, "imageHeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imageThumbnailPath', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SurveyFileUpload.prototype, "imageThumbnailPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'videoDuration', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], SurveyFileUpload.prototype, "videoDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'videoThumbnailPath', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "videoThumbnailPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'completed' }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processingError', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "processingError", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploadedBy', type: 'uuid' }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updatedBy', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SurveyFileUpload.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'createdAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], SurveyFileUpload.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updatedAt', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], SurveyFileUpload.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deletedAt', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SurveyFileUpload.prototype, "deletedAt", void 0);
exports.SurveyFileUpload = SurveyFileUpload = __decorate([
    (0, typeorm_1.Entity)({ name: 'SurveyFileUploads' }),
    (0, typeorm_1.Index)('idx_file_tenant', ['tenantId']),
    (0, typeorm_1.Index)('idx_file_survey', ['surveyId']),
    (0, typeorm_1.Index)('idx_file_response', ['responseId']),
    (0, typeorm_1.Index)('idx_file_field', ['fieldId']),
    (0, typeorm_1.Index)('idx_file_uploaded_by', ['uploadedBy'])
], SurveyFileUpload);
//# sourceMappingURL=survey-file-upload.entity.js.map