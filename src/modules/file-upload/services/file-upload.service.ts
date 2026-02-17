import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyFileUpload } from '../entities/survey-file-upload.entity';
import { StorageService } from '@/modules/storage/services/storage.service';
import { TenantService } from '@/modules/tenant/services/tenant.service';
import { ImageProcessingService } from './image-processing.service';
import { VideoProcessingService } from './video-processing.service';
import { VirusScanService } from './virus-scan.service';

export interface UploadFileOptions {
  tenantId: string;
  surveyId: string;
  responseId: string;
  fieldId: string;
  file: Express.Multer.File;
  uploadedBy: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    @InjectRepository(SurveyFileUpload)
    private readonly fileRepo: Repository<SurveyFileUpload>,
    private readonly storageService: StorageService,
    private readonly tenantService: TenantService,
    private readonly imageProcessing: ImageProcessingService,
    private readonly videoProcessing: VideoProcessingService,
    private readonly virusScan: VirusScanService,
  ) {}

  async uploadFile(options: UploadFileOptions) {
    const { tenantId, surveyId, responseId, fieldId, file, uploadedBy } =
      options;

    // Check tenant storage quota
    const hasSpace = await this.tenantService.checkStorageAvailable(
      tenantId,
      file.size,
    );
    if (!hasSpace) {
      throw new ForbiddenException('Storage quota exceeded');
    }

    // Upload to storage
    const storageInfo = await this.storageService.uploadFile({
      tenantId,
      surveyId,
      responseId,
      fieldId,
      file,
    });

    // Create database record
    const fileRecord = this.fileRepo.create({
      tenant_id: tenantId,
      survey_id: surveyId,
      response_id: responseId,
      field_id: fieldId,
      original_filename: file.originalname,
      stored_filename: storageInfo.storedFilename,
      file_path: storageInfo.filePath,
      file_size: storageInfo.fileSize,
      mime_type: storageInfo.mimeType,
      file_type: storageInfo.fileType,
      status: 'uploading',
      uploaded_by: uploadedBy,
    });

    await this.fileRepo.save(fileRecord);

    // Process file asynchronously (in-process for simplicity; use Bull queue in production)
    this.processFileAsync(fileRecord, file.buffer).catch((err) => {
      this.logger.error(
        `Async processing failed for file ${fileRecord.file_id}: ${err.message}`,
      );
    });

    return {
      success: true,
      data: {
        fileId: fileRecord.file_id,
        filename: fileRecord.original_filename,
        fileSize: fileRecord.file_size,
        fileType: fileRecord.file_type,
        status: fileRecord.status,
      },
    };
  }

  async getFile(tenantId: string, surveyId: string, fileId: string) {
    const file = await this.fileRepo.findOne({
      where: {
        file_id: fileId,
        tenant_id: tenantId,
        survey_id: surveyId,
      },
    });

    if (!file || file.deleted_at) {
      throw new NotFoundException('File not found');
    }

    // Generate presigned URL if expired
    let accessUrl = file.access_url;
    if (
      !accessUrl ||
      !file.access_url_expires_at ||
      new Date() > file.access_url_expires_at
    ) {
      accessUrl = await this.storageService.getPresignedUrl(file.file_path);
      file.access_url = accessUrl;
      file.access_url_expires_at = new Date(Date.now() + 3600 * 1000);
      await this.fileRepo.save(file);
    }

    return {
      success: true,
      data: {
        fileId: file.file_id,
        filename: file.original_filename,
        fileSize: file.file_size,
        fileType: file.file_type,
        mimeType: file.mime_type,
        status: file.status,
        accessUrl,
        thumbnailUrl: file.image_thumbnail_path || file.video_thumbnail_path,
        metadata: this.buildMetadata(file),
        uploadedAt: file.uploaded_at,
      },
    };
  }

  async getFileAccessUrl(tenantId: string, surveyId: string, fileId: string) {
    const result = await this.getFile(tenantId, surveyId, fileId);
    return {
      success: true,
      data: {
        url: result.data.accessUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    };
  }

  async deleteFile(
    tenantId: string,
    surveyId: string,
    fileId: string,
    userId: string,
  ) {
    const file = await this.fileRepo.findOne({
      where: {
        file_id: fileId,
        tenant_id: tenantId,
        survey_id: surveyId,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Soft delete
    file.deleted_at = new Date();
    file.status = 'deleted';
    await this.fileRepo.save(file);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  // --- Private helpers ---

  private async processFileAsync(
    fileRecord: SurveyFileUpload,
    buffer: Buffer,
  ): Promise<void> {
    try {
      fileRecord.status = 'processing';
      await this.fileRepo.save(fileRecord);

      // Virus scan
      const scanResult = await this.virusScan.scanFile(fileRecord.file_path);
      fileRecord.virus_scan_status = scanResult.clean ? 'clean' : 'infected';
      fileRecord.virus_scan_at = new Date();

      if (!scanResult.clean) {
        fileRecord.status = 'failed';
        fileRecord.processing_error = `Virus detected: ${scanResult.threat}`;
        await this.fileRepo.save(fileRecord);
        return;
      }

      // Process based on type
      if (fileRecord.file_type === 'image') {
        const result = await this.imageProcessing.processImage(
          fileRecord.file_path,
          buffer,
        );
        fileRecord.image_width = result.width;
        fileRecord.image_height = result.height;
        fileRecord.image_thumbnail_path = result.thumbnailPath;
      } else if (fileRecord.file_type === 'video') {
        const result = await this.videoProcessing.processVideo(
          fileRecord.file_path,
        );
        fileRecord.video_duration = result.duration;
        fileRecord.video_codec = result.codec;
        fileRecord.video_thumbnail_path = result.thumbnailPath;
      }

      fileRecord.status = 'completed';
      await this.fileRepo.save(fileRecord);
    } catch (error) {
      fileRecord.status = 'failed';
      fileRecord.processing_error = error.message;
      await this.fileRepo.save(fileRecord);
    }
  }

  private buildMetadata(file: SurveyFileUpload) {
    if (file.file_type === 'image') {
      return {
        width: file.image_width,
        height: file.image_height,
      };
    }
    return {
      duration: file.video_duration,
      codec: file.video_codec,
    };
  }
}
