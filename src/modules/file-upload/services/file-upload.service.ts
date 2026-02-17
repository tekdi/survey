import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { SurveyFileUpload } from '../entities/survey-file-upload.entity';
import { StorageService } from '@/modules/storage/services/storage.service';
import { ImageProcessingService } from './image-processing.service';
import { VideoProcessingService } from './video-processing.service';
import { VirusScanService } from './virus-scan.service';
import { APIResponse } from '@/common/responses/api-response';
import { APIID } from '@/common/utils/api-id.config';
import { RESPONSE_MESSAGES } from '@/common/utils/response-messages';
import { ReportSyncService } from '@/modules/report-sync/services/report-sync.service';
import { SurveyEventType } from '@/modules/report-sync/config/report-events.config';

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
    private readonly imageProcessing: ImageProcessingService,
    private readonly videoProcessing: VideoProcessingService,
    private readonly virusScan: VirusScanService,
    private readonly reportSyncService: ReportSyncService,
  ) {}

  async uploadFile(
    request: Request,
    options: UploadFileOptions,
    response: Response,
  ) {
    const apiId = APIID.FILE_UPLOAD;
    try {
      const { tenantId, surveyId, responseId, fieldId, file, uploadedBy } = options;

      if (!file) {
        throw new BadRequestException(RESPONSE_MESSAGES.FILE_REQUIRED);
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
        status: 'uploading',
        uploadedBy,
        createdBy: uploadedBy,
        updatedBy: uploadedBy,
      });

      await this.fileRepo.save(fileRecord);

      // Process file asynchronously
      this.processFileAsync(fileRecord, file.buffer).catch((err) => {
        this.logger.error(
          `Async processing failed for file ${fileRecord.fileId}: ${err.message}`,
        );
      });

      // Sync to reporting DB
      this.reportSyncService
        .syncSurveyEvent(SurveyEventType.FILE_UPLOADED, {
          fileId: fileRecord.fileId,
          surveyId: fileRecord.surveyId,
          tenantId: fileRecord.tenantId,
          fieldId: fileRecord.fieldId,
          fileType: fileRecord.fileType,
        })
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      const result = {
        fileId: fileRecord.fileId,
        filename: fileRecord.originalFilename,
        fileSize: fileRecord.fileSize,
        fileType: fileRecord.fileType,
        status: fileRecord.status,
      };

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.CREATED,
        RESPONSE_MESSAGES.FILE_UPLOAD_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`File upload failed: ${e.message}`, e.stack);
      const status =
        e instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : e instanceof ForbiddenException
            ? HttpStatus.FORBIDDEN
            : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, e.message, e.name || 'Error', status);
    }
  }

  async getFile(
    request: Request,
    tenantId: string,
    surveyId: string,
    fileId: string,
    response: Response,
  ) {
    const apiId = APIID.FILE_READ;
    try {
      const file = await this.fileRepo.findOne({
        where: { fileId, tenantId, surveyId },
      });

      if (!file || file.deletedAt) {
        throw new NotFoundException(RESPONSE_MESSAGES.FILE_NOT_FOUND);
      }

      // Generate presigned URL if expired
      let accessUrl = file.accessUrl;
      if (
        !accessUrl ||
        !file.accessUrlExpiresAt ||
        new Date() > file.accessUrlExpiresAt
      ) {
        accessUrl = await this.storageService.getPresignedUrl(file.filePath);
        file.accessUrl = accessUrl;
        file.accessUrlExpiresAt = new Date(Date.now() + 3600 * 1000);
        await this.fileRepo.save(file);
      }

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

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        RESPONSE_MESSAGES.FILE_READ_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`File read failed: ${e.message}`, e.stack);
      const status =
        e instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, e.message, e.name, status);
    }
  }

  async getFileAccessUrl(
    request: Request,
    tenantId: string,
    surveyId: string,
    fileId: string,
    response: Response,
  ) {
    const apiId = APIID.FILE_URL;
    try {
      const file = await this.fileRepo.findOne({
        where: { fileId, tenantId, surveyId },
      });

      if (!file || file.deletedAt) {
        throw new NotFoundException(RESPONSE_MESSAGES.FILE_NOT_FOUND);
      }

      const accessUrl = await this.storageService.getPresignedUrl(file.filePath);
      const result = {
        url: accessUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      return APIResponse.success(
        response,
        apiId,
        result,
        HttpStatus.OK,
        RESPONSE_MESSAGES.FILE_URL_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`File URL generation failed: ${e.message}`, e.stack);
      const status =
        e instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, e.message, e.name, status);
    }
  }

  async deleteFile(
    request: Request,
    tenantId: string,
    surveyId: string,
    fileId: string,
    userId: string,
    response: Response,
  ) {
    const apiId = APIID.FILE_DELETE;
    try {
      const file = await this.fileRepo.findOne({
        where: { fileId, tenantId, surveyId },
      });

      if (!file) {
        throw new NotFoundException(RESPONSE_MESSAGES.FILE_NOT_FOUND);
      }

      // Soft delete
      file.deletedAt = new Date();
      file.status = 'deleted';
      file.updatedBy = userId;
      await this.fileRepo.save(file);

      // Sync to reporting DB
      this.reportSyncService
        .syncSurveyEvent(SurveyEventType.FILE_DELETED, {
          fileId: file.fileId,
          surveyId: file.surveyId,
          tenantId: file.tenantId,
        })
        .catch((err) => this.logger.error('Report sync failed', err.stack));

      return APIResponse.success(
        response,
        apiId,
        { fileId },
        HttpStatus.OK,
        RESPONSE_MESSAGES.FILE_DELETE_SUCCESS,
      );
    } catch (e) {
      this.logger.error(`File delete failed: ${e.message}`, e.stack);
      const status =
        e instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : e.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return APIResponse.error(response, apiId, e.message, e.name, status);
    }
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
      const scanResult = await this.virusScan.scanFile(fileRecord.filePath);
      fileRecord.virusScanStatus = scanResult.clean ? 'clean' : 'infected';
      fileRecord.virusScanAt = new Date();

      if (!scanResult.clean) {
        fileRecord.status = 'failed';
        fileRecord.processingError = `Virus detected: ${scanResult.threat}`;
        await this.fileRepo.save(fileRecord);
        return;
      }

      // Process based on type
      if (fileRecord.fileType === 'image') {
        const result = await this.imageProcessing.processImage(
          fileRecord.filePath,
          buffer,
        );
        fileRecord.imageWidth = result.width;
        fileRecord.imageHeight = result.height;
        fileRecord.imageThumbnailPath = result.thumbnailPath;
      } else if (fileRecord.fileType === 'video') {
        const result = await this.videoProcessing.processVideo(
          fileRecord.filePath,
        );
        fileRecord.videoDuration = result.duration;
        fileRecord.videoCodec = result.codec;
        fileRecord.videoThumbnailPath = result.thumbnailPath;
      }

      fileRecord.status = 'completed';
      await this.fileRepo.save(fileRecord);
    } catch (error) {
      fileRecord.status = 'failed';
      fileRecord.processingError = error.message;
      await this.fileRepo.save(fileRecord);
    }
  }

  private buildMetadata(file: SurveyFileUpload) {
    if (file.fileType === 'image') {
      return {
        width: file.imageWidth,
        height: file.imageHeight,
      };
    }
    return {
      duration: file.videoDuration,
      codec: file.videoCodec,
    };
  }
}
