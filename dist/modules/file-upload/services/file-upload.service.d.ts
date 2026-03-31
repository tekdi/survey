import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { SurveyFileUpload } from '../entities/survey-file-upload.entity';
import { StorageService } from '@/modules/storage/services/storage.service';
import { ImageProcessingService } from './image-processing.service';
import { VideoProcessingService } from './video-processing.service';
import { VirusScanService } from './virus-scan.service';
import { KafkaService } from '@/kafka/kafka.service';
export interface UploadFileOptions {
    tenantId: string;
    surveyId: string;
    responseId: string;
    fieldId: string;
    file: Express.Multer.File;
    uploadedBy: string;
}
export declare class FileUploadService {
    private readonly fileRepo;
    private readonly storageService;
    private readonly imageProcessing;
    private readonly videoProcessing;
    private readonly virusScan;
    private readonly kafkaService;
    private readonly logger;
    constructor(fileRepo: Repository<SurveyFileUpload>, storageService: StorageService, imageProcessing: ImageProcessingService, videoProcessing: VideoProcessingService, virusScan: VirusScanService, kafkaService: KafkaService);
    uploadFile(request: Request, options: UploadFileOptions, response: Response): Promise<any>;
    getFile(request: Request, tenantId: string, surveyId: string, fileId: string, response: Response): Promise<any>;
    getFileAccessUrl(request: Request, tenantId: string, surveyId: string, fileId: string, response: Response): Promise<any>;
    deleteFile(request: Request, tenantId: string, surveyId: string, fileId: string, userId: string, response: Response): Promise<any>;
    private extractImageMetadata;
    private buildMetadata;
}
