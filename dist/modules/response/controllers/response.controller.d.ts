import { Request, Response } from 'express';
import { ResponseService } from '../services/response.service';
import { CreateResponseDto, UpdateResponseDto, SubmitResponseDto } from '../dto/create-response.dto';
export declare class ResponseController {
    private readonly responseService;
    constructor(responseService: ResponseService);
    create(request: Request, dto: CreateResponseDto, response: Response, tenantId: string, userId: string, surveyId: string): Promise<any>;
    findAll(request: Request, body: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }, response: Response, tenantId: string, surveyId: string): Promise<any>;
    getStats(request: Request, response: Response, tenantId: string, surveyId: string): Promise<any>;
    findOne(request: Request, response: Response, tenantId: string, responseId: string): Promise<any>;
    update(request: Request, response: Response, tenantId: string, responseId: string, userId: string, dto: UpdateResponseDto): Promise<any>;
    submit(request: Request, response: Response, tenantId: string, responseId: string, userId: string, dto: SubmitResponseDto): Promise<any>;
}
