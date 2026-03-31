import { Request, Response } from 'express';
import { FileUploadService } from '../services/file-upload.service';
import { UploadFileDto } from '../dto/upload-file.dto';
export declare class FileUploadController {
    private readonly fileUploadService;
    constructor(fileUploadService: FileUploadService);
    uploadFile(request: Request, response: Response, tenantId: string, surveyId: string, userId: string, file: Express.Multer.File, uploadFileDto: UploadFileDto): Promise<any>;
    getFile(request: Request, response: Response, tenantId: string, surveyId: string, fileId: string): Promise<any>;
    getFileUrl(request: Request, response: Response, tenantId: string, surveyId: string, fileId: string): Promise<any>;
    deleteFile(request: Request, response: Response, tenantId: string, surveyId: string, fileId: string, userId: string): Promise<any>;
}
