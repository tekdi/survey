import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@/modules/storage/services/storage.service';

// Note: sharp is imported dynamically to handle environments where it's not available
let sharp: any;
try {
  sharp = require('sharp');
} catch {
  // sharp not available — processing will be skipped
}

export interface ImageProcessResult {
  width: number;
  height: number;
  thumbnailPath: string | null;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storage: StorageService,
  ) {}

  async processImage(
    filePath: string,
    fileBuffer?: Buffer,
  ): Promise<ImageProcessResult> {
    if (!sharp) {
      this.logger.warn('sharp not available, skipping image processing');
      return { width: 0, height: 0, thumbnailPath: null };
    }

    try {
      const buffer = fileBuffer || (await this.storage.getFileBuffer(filePath));
      const metadata = await sharp(buffer).metadata();

      // Generate thumbnail
      const thumbnailConfig = this.configService.get(
        'storage.imageProcessing.thumbnail',
      );
      let thumbnailPath: string | null = null;

      if (thumbnailConfig?.enabled) {
        const thumbnailBuffer = await sharp(buffer)
          .resize(thumbnailConfig.width, thumbnailConfig.height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: thumbnailConfig.quality })
          .toBuffer();

        thumbnailPath = filePath.replace(
          /\.(jpg|jpeg|png|gif|webp)$/i,
          '_thumb.jpg',
        );

        await this.storage.uploadBuffer(
          thumbnailPath,
          thumbnailBuffer,
          'image/jpeg',
        );
      }

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        thumbnailPath,
      };
    } catch (error) {
      this.logger.error(
        `Image processing failed: ${error.message}`,
        error.stack,
      );
      return { width: 0, height: 0, thumbnailPath: null };
    }
  }

  async optimizeImage(buffer: Buffer): Promise<Buffer> {
    if (!sharp) return buffer;

    return sharp(buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  }

  async generateThumbnail(buffer: Buffer, size = 200): Promise<Buffer> {
    if (!sharp) return buffer;

    return sharp(buffer)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}
