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
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs = require("fs/promises");
const path = require("path");
const uuid_1 = require("uuid");
let StorageService = class StorageService {
    constructor(configService) {
        this.configService = configService;
        this.provider = this.configService.get('storage.provider') || 'local';
        this.bucket = this.configService.get('storage.s3.bucket') || 'survey-media';
        if (this.provider === 's3' || this.provider === 'minio') {
            this.s3Client = new client_s3_1.S3Client({
                endpoint: this.configService.get('storage.s3.endpoint') || undefined,
                region: this.configService.get('storage.s3.region') || 'us-east-1',
                credentials: {
                    accessKeyId: this.configService.get('storage.s3.accessKeyId') || '',
                    secretAccessKey: this.configService.get('storage.s3.secretAccessKey') || '',
                },
                forcePathStyle: this.provider === 'minio',
            });
        }
    }
    async uploadFile(options) {
        const { tenantId, surveyId, responseId, fieldId, file } = options;
        this.validateFile(file);
        const fileId = (0, uuid_1.v4)();
        const fileExtension = path.extname(file.originalname);
        const storedFilename = `${fileId}${fileExtension}`;
        const fileType = this.getFileType(file.mimetype);
        const filePath = this.buildFilePath({
            tenantId,
            surveyId,
            responseId,
            fieldId,
            fileId,
            filename: storedFilename,
        });
        if (this.provider === 's3' || this.provider === 'minio') {
            await this.uploadToS3(filePath, file.buffer, file.mimetype);
        }
        else {
            await this.uploadToLocal(filePath, file.buffer);
        }
        return {
            fileId,
            storedFilename,
            filePath,
            fileSize: file.size,
            mimeType: file.mimetype,
            fileType,
        };
    }
    async uploadBuffer(filePath, buffer, mimeType) {
        if (this.provider === 's3' || this.provider === 'minio') {
            await this.uploadToS3(filePath, buffer, mimeType);
        }
        else {
            await this.uploadToLocal(filePath, buffer);
        }
    }
    async getFileBuffer(filePath) {
        if (this.provider === 's3' || this.provider === 'minio') {
            return this.getFromS3(filePath);
        }
        else {
            return this.getFromLocal(filePath);
        }
    }
    async getPresignedUrl(filePath, expiresIn) {
        const ttl = expiresIn ||
            this.configService.get('storage.s3.presignedUrlTtl') ||
            3600;
        if (this.provider === 's3' || this.provider === 'minio') {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
            });
            return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: ttl });
        }
        else {
            const publicUrl = this.configService.get('storage.local.publicUrl');
            return `${publicUrl}/${filePath}`;
        }
    }
    async deleteFile(filePath) {
        if (this.provider === 's3' || this.provider === 'minio') {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
            });
            await this.s3Client.send(command);
        }
        else {
            const uploadPath = this.configService.get('storage.local.uploadPath') || './uploads';
            const fullPath = path.join(uploadPath, filePath);
            try {
                await fs.unlink(fullPath);
            }
            catch (err) {
            }
        }
    }
    async uploadToS3(filePath, buffer, mimeType) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
            Body: buffer,
            ContentType: mimeType,
        });
        await this.s3Client.send(command);
    }
    async uploadToLocal(filePath, buffer) {
        const uploadPath = this.configService.get('storage.local.uploadPath') || './uploads';
        const fullPath = path.join(uploadPath, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, buffer);
    }
    async getFromS3(filePath) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
        });
        const response = await this.s3Client.send(command);
        const stream = response.Body;
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }
    async getFromLocal(filePath) {
        const uploadPath = this.configService.get('storage.local.uploadPath') || './uploads';
        const fullPath = path.join(uploadPath, filePath);
        return fs.readFile(fullPath);
    }
    validateFile(file) {
        const fileType = this.getFileType(file.mimetype);
        const maxSize = this.configService.get(`storage.limits.${fileType}.maxSize`);
        const allowedMimeTypes = this.configService.get(`storage.limits.${fileType}.allowedMimeTypes`);
        if (!maxSize || !allowedMimeTypes) {
            throw new common_1.BadRequestException('Unsupported file type');
        }
        if (file.size > maxSize) {
            throw new common_1.BadRequestException(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)} MB`);
        }
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`File type not allowed: ${file.mimetype}`);
        }
    }
    getFileType(mimeType) {
        if (mimeType.startsWith('image/'))
            return 'image';
        if (mimeType.startsWith('video/'))
            return 'video';
        throw new common_1.BadRequestException('Unsupported file type');
    }
    buildFilePath(params) {
        const { tenantId, surveyId, responseId, fieldId, filename } = params;
        const responsePath = responseId ? `/responses/${responseId}` : '';
        return `${tenantId}/surveys/${surveyId}${responsePath}/${fieldId}/${filename}`;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map