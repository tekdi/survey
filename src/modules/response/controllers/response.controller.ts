import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  UseFilters,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { ResponseService } from '../services/response.service';
import {
  CreateResponseDto,
  UpdateResponseDto,
  SubmitResponseDto,
} from '../dto/create-response.dto';
import { APIID } from '@/common/utils/api-id.config';

import { JwtAuthGuard } from '@/common/guards/keycloak.guard';
import { AllExceptionsFilter } from '@/common/filters/exception.filter';
import { GetTenantId } from '@/common/decorators/tenant.decorator';
import { GetUserId } from '@/common/decorators/current-user.decorator';

@ApiTags('survey-responses')
@ApiBearerAuth()
@Controller('responses')
@UseGuards(JwtAuthGuard)
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}

  @UseFilters(new AllExceptionsFilter(APIID.RESPONSE_CREATE))
  @Post('create/:surveyId')
  @UsePipes(new ValidationPipe())
  @ApiHeader({ name: 'tenantid' })
  @ApiCreatedResponse({ description: 'Response started successfully' })
  public async create(
    @Req() request: Request,
    @Body() dto: CreateResponseDto,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @GetUserId() userId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    dto.surveyId = surveyId;
    return this.responseService.create(request, tenantId, userId, dto, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.RESPONSE_LIST))
  @Post('list/:surveyId')
  @UsePipes(new ValidationPipe())
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Responses fetched successfully' })
  public async findAll(
    @Req() request: Request,
    @Body() body: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' },
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.responseService.findAllBySurvey(request, tenantId, surveyId, body, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.RESPONSE_STATS))
  @Get('stats/:surveyId')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Response statistics fetched successfully' })
  public async getStats(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.responseService.getStats(request, tenantId, surveyId, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.RESPONSE_READ))
  @Get('read/:responseId')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Response fetched successfully' })
  public async findOne(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('responseId', ParseUUIDPipe) responseId: string,
  ) {
    return this.responseService.findOne(request, tenantId, responseId, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.RESPONSE_UPDATE))
  @Put('update/:responseId')
  @UsePipes(new ValidationPipe())
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Response updated successfully' })
  public async update(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @GetUserId() userId: string,
    @Body() dto: UpdateResponseDto,
  ) {
    return this.responseService.update(request, tenantId, responseId, userId, dto, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.RESPONSE_SUBMIT))
  @Post('submit/:responseId')
  @UsePipes(new ValidationPipe())
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Response submitted successfully' })
  public async submit(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @GetUserId() userId: string,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.responseService.submit(request, tenantId, responseId, userId, dto, response);
  }
}
