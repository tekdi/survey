import { ConfigService } from '@nestjs/config';
import { StorageService } from '@/modules/storage/services/storage.service';
export interface ImageProcessResult {
    width: number;
    height: number;
    thumbnailPath: string | null;
}
export declare class ImageProcessingService {
    private readonly configService;
    private readonly storage;
    private readonly logger;
    constructor(configService: ConfigService, storage: StorageService);
    processImage(filePath: string, fileBuffer?: Buffer): Promise<ImageProcessResult>;
    optimizeImage(buffer: Buffer): Promise<Buffer>;
    generateThumbnail(buffer: Buffer, size?: number): Promise<Buffer>;
}
