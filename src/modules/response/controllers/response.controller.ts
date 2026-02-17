import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { ResponseService } from '../services/response.service';
import {
  CreateResponseDto,
  UpdateResponseDto,
  SubmitResponseDto,
} from '../dto/create-response.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { Tenant } from '@/common/decorators/tenant.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('survey-responses')
@ApiBearerAuth()
@Controller('surveys/:surveyId/responses')
@UseGuards(AuthGuard, TenantGuard)
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new survey response' })
  async create(
    @Tenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: CreateResponseDto,
  ) {
    dto.survey_id = surveyId;
    return this.responseService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all responses for a survey' })
  async findAll(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.responseService.findAllBySurvey(tenantId, surveyId, pagination);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get response statistics for a survey' })
  async getStats(
    @Tenant() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.responseService.getStats(tenantId, surveyId);
  }

  @Get(':responseId')
  @ApiOperation({ summary: 'Get a specific response' })
  async findOne(
    @Tenant() tenantId: string,
    @Param('responseId', ParseUUIDPipe) responseId: string,
  ) {
    return this.responseService.findOne(tenantId, responseId);
  }

  @Put(':responseId')
  @ApiOperation({ summary: 'Update response data (partial save)' })
  async update(
    @Tenant() tenantId: string,
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateResponseDto,
  ) {
    return this.responseService.update(tenantId, responseId, userId, dto);
  }

  @Post(':responseId/submit')
  @ApiOperation({ summary: 'Submit a response (final)' })
  @HttpCode(HttpStatus.OK)
  async submit(
    @Tenant() tenantId: string,
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.responseService.submit(tenantId, responseId, userId, dto);
  }
}
