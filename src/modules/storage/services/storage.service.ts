import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export interface UploadOptions {
  tenantId: string;
  surveyId: string;
  responseId: string;
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

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private provider: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<string>('storage.provider');
    this.bucket = this.configService.get<string>('storage.s3.bucket');

    if (this.provider === 's3' || this.provider === 'minio') {
      this.s3Client = new S3Client({
        endpoint: this.configService.get<string>('storage.s3.endpoint'),
        region: this.configService.get<string>('storage.s3.region'),
        credentials: {
          accessKeyId: this.configService.get<string>('storage.s3.accessKeyId'),
          secretAccessKey: this.configService.get<string>(
            'storage.s3.secretAccessKey',
          ),
        },
        forcePathStyle: this.provider === 'minio',
      });
    }
  }

  async uploadFile(options: UploadOptions): Promise<StoredFileInfo> {
    const { tenantId, surveyId, responseId, fieldId, file } = options;

    this.validateFile(file);

    const fileId = uuidv4();
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
    } else {
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

  async uploadBuffer(
    filePath: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    if (this.provider === 's3' || this.provider === 'minio') {
      await this.uploadToS3(filePath, buffer, mimeType);
    } else {
      await this.uploadToLocal(filePath, buffer);
    }
  }

  async getFileBuffer(filePath: string): Promise<Buffer> {
    if (this.provider === 's3' || this.provider === 'minio') {
      return this.getFromS3(filePath);
    } else {
      return this.getFromLocal(filePath);
    }
  }

  async getPresignedUrl(
    filePath: string,
    expiresIn?: number,
  ): Promise<string> {
    const ttl =
      expiresIn ||
      this.configService.get<number>('storage.s3.presignedUrlTtl') ||
      3600;

    if (this.provider === 's3' || this.provider === 'minio') {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });
      return getSignedUrl(this.s3Client, command, { expiresIn: ttl });
    } else {
      const publicUrl = this.configService.get<string>(
        'storage.local.publicUrl',
      );
      return `${publicUrl}/${filePath}`;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    if (this.provider === 's3' || this.provider === 'minio') {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });
      await this.s3Client.send(command);
    } else {
      const uploadPath = this.configService.get<string>(
        'storage.local.uploadPath',
      );
      const fullPath = path.join(uploadPath, filePath);
      try {
        await fs.unlink(fullPath);
      } catch (err) {
        // File may already be deleted
      }
    }
  }

  // --- Private helpers ---

  private async uploadToS3(
    filePath: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      Body: buffer,
      ContentType: mimeType,
    });
    await this.s3Client.send(command);
  }

  private async uploadToLocal(
    filePath: string,
    buffer: Buffer,
  ): Promise<void> {
    const uploadPath = this.configService.get<string>(
      'storage.local.uploadPath',
    );
    const fullPath = path.join(uploadPath, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
  }

  private async getFromS3(filePath: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });
    const response = await this.s3Client.send(command);
    const stream = response.Body as Readable;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  private async getFromLocal(filePath: string): Promise<Buffer> {
    const uploadPath = this.configService.get<string>(
      'storage.local.uploadPath',
    );
    const fullPath = path.join(uploadPath, filePath);
    return fs.readFile(fullPath);
  }

  private validateFile(file: Express.Multer.File): void {
    const fileType = this.getFileType(file.mimetype);
    const maxSize = this.configService.get<number>(
      `storage.limits.${fileType}.maxSize`,
    );
    const allowedMimeTypes = this.configService.get<string[]>(
      `storage.limits.${fileType}.allowedMimeTypes`,
    );

    if (!maxSize || !allowedMimeTypes) {
      throw new BadRequestException('Unsupported file type');
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)} MB`,
      );
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed: ${file.mimetype}`,
      );
    }
  }

  private getFileType(mimeType: string): 'image' | 'video' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    throw new BadRequestException('Unsupported file type');
  }

  private buildFilePath(params: {
    tenantId: string;
    surveyId: string;
    responseId: string;
    fieldId: string;
    fileId: string;
    filename: string;
  }): string {
    const { tenantId, surveyId, responseId, fieldId, filename } = params;
    return `${tenantId}/surveys/${surveyId}/responses/${responseId}/${fieldId}/${filename}`;
  }
}
