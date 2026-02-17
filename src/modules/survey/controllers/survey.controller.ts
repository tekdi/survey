import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { SurveyService } from '../services/survey.service';
import { CreateSurveyDto } from '../dto/create-survey.dto';
import { UpdateSurveyDto } from '../dto/update-survey.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { Tenant } from '@/common/decorators/tenant.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('surveys')
@ApiBearerAuth()
@Controller('surveys')
@UseGuards(AuthGuard, TenantGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new survey' })
  async create(
    @Tenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSurveyDto,
  ) {
    return this.surveyService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all surveys for tenant' })
  async findAll(
    @Tenant() tenantId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.surveyService.findAll(tenantId, pagination);
  }

  @Get(':surveyId')
  @ApiOperation({ summary: 'Get survey by ID with all sections and fields' })
  @ApiParam({ name: 'surveyId', type: 'string', format: 'uuid' })
  async findOne(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.findOne(tenantId, surveyId);
  }

  @Put(':surveyId')
  @ApiOperation({ summary: 'Update survey' })
  async update(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: UpdateSurveyDto,
  ) {
    return this.surveyService.update(tenantId, surveyId, dto);
  }

  @Post(':surveyId/publish')
  @ApiOperation({ summary: 'Publish a draft survey' })
  @HttpCode(HttpStatus.OK)
  async publish(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.publish(tenantId, surveyId);
  }

  @Post(':surveyId/close')
  @ApiOperation({ summary: 'Close a published survey' })
  @HttpCode(HttpStatus.OK)
  async close(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.close(tenantId, surveyId);
  }

  @Post(':surveyId/duplicate')
  @ApiOperation({ summary: 'Duplicate a survey' })
  async duplicate(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.surveyService.duplicate(tenantId, surveyId, userId);
  }

  @Delete(':surveyId')
  @ApiOperation({ summary: 'Delete a survey' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    await this.surveyService.delete(tenantId, surveyId);
  }
}
