import { Request, Response } from 'express';
import { SurveyService } from '../services/survey.service';
import { CreateSurveyDto } from '../dto/create-survey.dto';
import { UpdateSurveyDto } from '../dto/update-survey.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
export declare class SurveyController {
    private readonly surveyService;
    constructor(surveyService: SurveyService);
    create(request: Request, dto: CreateSurveyDto, response: Response, tenantId: string, userId: string): Promise<any>;
    findAll(request: Request, pagination: PaginationDto, response: Response, tenantId: string, userRoles: string[]): Promise<any>;
    findOne(request: Request, response: Response, tenantId: string, surveyId: string): Promise<any>;
    update(request: Request, response: Response, tenantId: string, surveyId: string, dto: UpdateSurveyDto): Promise<any>;
    publish(request: Request, response: Response, tenantId: string, surveyId: string): Promise<any>;
    close(request: Request, response: Response, tenantId: string, surveyId: string): Promise<any>;
    duplicate(request: Request, response: Response, tenantId: string, surveyId: string, userId: string): Promise<any>;
    delete(request: Request, response: Response, tenantId: string, surveyId: string): Promise<any>;
}
