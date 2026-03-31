import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { SurveyResponse } from '../entities/survey-response.entity';
import { CreateResponseDto, UpdateResponseDto, SubmitResponseDto } from '../dto/create-response.dto';
import { SurveyService } from '@/modules/survey/services/survey.service';
import { KafkaService } from '@/kafka/kafka.service';
import { LoggerService } from '@/common/logger/logger.service';
export declare class ResponseService {
    private readonly responseRepo;
    private readonly surveyService;
    private readonly kafkaService;
    private readonly loggerService;
    constructor(responseRepo: Repository<SurveyResponse>, surveyService: SurveyService, kafkaService: KafkaService, loggerService: LoggerService);
    create(request: Request, tenantId: string, userId: string, dto: CreateResponseDto, response: Response): Promise<any>;
    findAllBySurvey(request: Request, tenantId: string, surveyId: string, pagination: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }, response: Response): Promise<any>;
    findOne(request: Request, tenantId: string, responseId: string, response: Response): Promise<any>;
    update(request: Request, tenantId: string, responseId: string, userId: string, dto: UpdateResponseDto, response: Response): Promise<any>;
    submit(request: Request, tenantId: string, responseId: string, userId: string, dto: SubmitResponseDto, response: Response): Promise<any>;
    getStats(request: Request, tenantId: string, surveyId: string, response: Response): Promise<any>;
    getResponseById(tenantId: string, responseId: string): Promise<SurveyResponse>;
    private validateRequiredFields;
    private calculateTimeSpent;
}
