import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { FileUploadService } from '../services/file-upload.service';
import { UploadFileDto } from '../dto/upload-file.dto';

import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { Tenant } from '@/common/decorators/tenant.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('file-upload')
@ApiBearerAuth()
@Controller('surveys/:surveyId/files')
@UseGuards(AuthGuard, TenantGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image or video file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
    }),
  )
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async uploadFile(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.fileUploadService.uploadFile({
      tenantId,
      surveyId,
      responseId: uploadFileDto.responseId,
      fieldId: uploadFileDto.fieldId,
      file,
      uploadedBy: userId,
    });
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file metadata and access URL' })
  async getFile(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.fileUploadService.getFile(tenantId, surveyId, fileId);
  }

  @Get(':fileId/url')
  @ApiOperation({ summary: 'Get presigned URL for file access' })
  async getFileUrl(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.fileUploadService.getFileAccessUrl(tenantId, surveyId, fileId);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a file (soft delete)' })
  async deleteFile(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.fileUploadService.deleteFile(
      tenantId,
      surveyId,
      fileId,
      userId,
    );
  }
}
