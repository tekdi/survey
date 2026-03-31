import { ConfigService } from '@nestjs/config';
export interface UploadOptions {
    tenantId: string;
    surveyId: string;
    responseId?: string;
    fieldId: string;
    file: Express.Multer.File;
}
export interface StoredFileInfo {
    fileId: string;
    storedFilename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileType: 'image' | 'video';
}
export declare class StorageService {
    private readonly configService;
    private s3Client;
    private bucket;
    private provider;
    constructor(configService: ConfigService);
    uploadFile(options: UploadOptions): Promise<StoredFileInfo>;
    uploadBuffer(filePath: string, buffer: Buffer, mimeType: string): Promise<void>;
    getFileBuffer(filePath: string): Promise<Buffer>;
    getPresignedUrl(filePath: string, expiresIn?: number): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
    private uploadToS3;
    private uploadToLocal;
    private getFromS3;
    private getFromLocal;
    private validateFile;
    private getFileType;
    private buildFilePath;
}
