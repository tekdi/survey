import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  UseFilters,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { SurveyService } from '../services/survey.service';
import { CreateSurveyDto } from '../dto/create-survey.dto';
import { UpdateSurveyDto } from '../dto/update-survey.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { APIID } from '@/common/utils/api-id.config';

import { JwtAuthGuard } from '@/common/guards/keycloak.guard';
import { AllExceptionsFilter } from '@/common/filters/exception.filter';
import { GetTenantId } from '@/common/decorators/tenant.decorator';
import { GetUserId } from '@/common/decorators/current-user.decorator';

@ApiTags('surveys')
@ApiBearerAuth()
@Controller('surveys')
@UseGuards(JwtAuthGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @UseFilters(new AllExceptionsFilter(APIID.SURVEY_CREATE))
  @Post('create')
  @UsePipes(new ValidationPipe())
  @ApiHeader({ name: 'tenantid' })
  @ApiCreatedResponse({ description: 'Survey created successfully' })
  public async create(
    @Req() request: Request,
    @Body() dto: CreateSurveyDto,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @GetUserId() userId: string,
  ) {
    return this.surveyService.create(request, tenantId, userId, dto, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.SURVEY_LIST))
  @Post('list')
  @UsePipes(new ValidationPipe())
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Surveys fetched successfully' })
  public async findAll(
    @Req() request: Request,
    @Body() pagination: PaginationDto,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
  ) {
    return this.surveyService.findAll(request, tenantId, pagination, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.SURVEY_READ))
  @Get('read/:surveyId')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Survey fetched successfully' })
  public async findOne(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.findOne(request, tenantId, surveyId, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.SURVEY_UPDATE))
  @Put('update/:surveyId')
  @UsePipes(new ValidationPipe())
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Survey updated successfully' })
  public async update(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: UpdateSurveyDto,
  ) {
    return this.surveyService.update(
      request,
      tenantId,
      surveyId,
      dto,
      response,
    );
  }

  @UseFilters(new AllExceptionsFilter(APIID.SURVEY_PUBLISH))
  @Post(':surveyId/publish')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Survey published successfully' })
  public async publish(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.publish(request, tenantId, surveyId, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.SURVEY_CLOSE))
  @Post(':surveyId/close')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Survey closed successfully' })
  public async close(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.close(request, tenantId, surveyId, response);
  }

  @UseFilters(new AllExceptionsFilter(APIID.SURVEY_DUPLICATE))
  @Post(':surveyId/duplicate')
  @ApiHeader({ name: 'tenantid' })
  @ApiCreatedResponse({ description: 'Survey duplicated successfully' })
  public async duplicate(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @GetUserId() userId: string,
  ) {
    return this.surveyService.duplicate(
      request,
      tenantId,
      surveyId,
      userId,
      response,
    );
  }

  @UseFilters(new AllExceptionsFilter(APIID.SURVEY_DELETE))
  @Delete('delete/:surveyId')
  @ApiHeader({ name: 'tenantid' })
  @ApiOkResponse({ description: 'Survey deleted successfully' })
  public async delete(
    @Req() request: Request,
    @Res() response: Response,
    @GetTenantId() tenantId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.delete(request, tenantId, surveyId, response);
  }
}
