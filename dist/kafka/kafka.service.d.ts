import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class KafkaService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly kafka;
    private producer;
    private admin;
    private readonly logger;
    private isKafkaEnabled;
    private topicsCreated;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connectProducer;
    private disconnectProducer;
    private connectAdmin;
    private disconnectAdmin;
    private ensureTopicExists;
    publishMessage(topic: string, message: any, key?: string): Promise<void>;
    publishSurveyEvent(eventType: 'created' | 'updated' | 'published' | 'closed' | 'deleted', surveyData: any, surveyId: string): Promise<void>;
    publishResponseEvent(eventType: 'started' | 'updated' | 'submitted', responseData: any, responseId: string): Promise<void>;
    publishFileEvent(eventType: 'uploaded' | 'deleted', fileData: any, fileId: string): Promise<void>;
}
