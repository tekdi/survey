import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  UseFilters,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { FileUploadService } from '../services/file-upload.service';
import { UploadFileDto } from '../dto/upload-file.dto';
import { APIID } from '@/common/utils/api-id.config';

import { JwtAuthGuard } from '@/common/guards/keycloak.guard';
import { AllExceptionsFilter } from '@/common/filters/exception.filter';
import { GetTenantId } from '@/common/decorators/tenant.decorator';
import { GetUserId } from '@/common/decorators/current-user.decorator';

@ApiTags('file-upload')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @UseFilters(new AllExceptionsFilter(APIID.FILE_UPLOAD))
  @Post('upload/:surveyId')
  @UsePipes(new ValidationPipe())
  @ApiHeader({ name: 'tenantid' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'File uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
    }),
  )
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  public async uploadFile(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @GetUserId() userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    return this.fileUploadService.uploadFile(
      request,
      {
        tenantId,
        surveyId,
        responseId: uploadFileDto.responseId,
        fieldId: uploadFileDto.fieldId,
        file,
        uploadedBy: userId,
      },
      response,
    );
  }

  @UseFilters(new AllExceptionsFilter(APIID.FILE_READ))
  @Get('read/:surveyId/:fileId')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'File details fetched successfully' })
  public async getFile(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.fileUploadService.getFile(request, tenantId, surveyId, fileId, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.FILE_URL))
  @Get('url/:surveyId/:fileId')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'File URL generated successfully' })
  public async getFileUrl(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.fileUploadService.getFileAccessUrl(request, tenantId, surveyId, fileId, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.FILE_DELETE))
  @Delete('delete/:surveyId/:fileId')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'File deleted successfully' })
  public async deleteFile(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @GetUserId() userId: string,
  ) {
    return this.fileUploadService.deleteFile(
      request,
      tenantId,
      surveyId,
      fileId,
      userId,
      response,
    );
  }
}
