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
var ImageProcessingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProcessingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const storage_service_1 = require("../../storage/services/storage.service");
let sharp;
try {
    sharp = require('sharp');
}
catch {
}
let ImageProcessingService = ImageProcessingService_1 = class ImageProcessingService {
    constructor(configService, storage) {
        this.configService = configService;
        this.storage = storage;
        this.logger = new common_1.Logger(ImageProcessingService_1.name);
    }
    async processImage(filePath, fileBuffer) {
        if (!sharp) {
            this.logger.warn('sharp not available, skipping image processing');
            return { width: 0, height: 0, thumbnailPath: null };
        }
        try {
            const buffer = fileBuffer || (await this.storage.getFileBuffer(filePath));
            const metadata = await sharp(buffer).metadata();
            const thumbnailConfig = this.configService.get('storage.imageProcessing.thumbnail');
            let thumbnailPath = null;
            if (thumbnailConfig?.enabled) {
                const thumbnailBuffer = await sharp(buffer)
                    .resize(thumbnailConfig.width, thumbnailConfig.height, {
                    fit: 'cover',
                    position: 'center',
                })
                    .jpeg({ quality: thumbnailConfig.quality })
                    .toBuffer();
                thumbnailPath = filePath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '_thumb.jpg');
                await this.storage.uploadBuffer(thumbnailPath, thumbnailBuffer, 'image/jpeg');
            }
            return {
                width: metadata.width || 0,
                height: metadata.height || 0,
                thumbnailPath,
            };
        }
        catch (error) {
            this.logger.error(`Image processing failed: ${error.message}`, error.stack);
            return { width: 0, height: 0, thumbnailPath: null };
        }
    }
    async optimizeImage(buffer) {
        if (!sharp)
            return buffer;
        return sharp(buffer)
            .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
    }
    async generateThumbnail(buffer, size = 200) {
        if (!sharp)
            return buffer;
        return sharp(buffer)
            .resize(size, size, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toBuffer();
    }
};
exports.ImageProcessingService = ImageProcessingService;
exports.ImageProcessingService = ImageProcessingService = ImageProcessingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        storage_service_1.StorageService])
], ImageProcessingService);
//# sourceMappingURL=image-processing.service.js.map