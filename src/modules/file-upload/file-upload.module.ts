import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { SurveyFileUpload } from './entities/survey-file-upload.entity';
import { FileUploadController } from './controllers/file-upload.controller';
import { FileUploadService } from './services/file-upload.service';
import { ImageProcessingService } from './services/image-processing.service';
import { VideoProcessingService } from './services/video-processing.service';
import { VirusScanService } from './services/virus-scan.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SurveyFileUpload]),
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB max
      },
    }),
  ],
  controllers: [FileUploadController],
  providers: [
    FileUploadService,
    ImageProcessingService,
    VideoProcessingService,
    VirusScanService,
  ],
  exports: [FileUploadService],
})
export class FileUploadModule {}
