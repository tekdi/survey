"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KafkaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafkajs_1 = require("kafkajs");
let KafkaService = KafkaService_1 = class KafkaService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(KafkaService_1.name);
        this.topicsCreated = new Set();
        this.isKafkaEnabled = this.configService.get('kafka.kafkaEnabled', false);
        const brokers = this.configService.get('kafka.brokers', ['localhost:9092']);
        const clientId = this.configService.get('kafka.clientId', 'survey-service');
        if (this.isKafkaEnabled) {
            this.kafka = new kafkajs_1.Kafka({
                clientId,
                brokers,
                retry: {
                    initialRetryTime: 100,
                    retries: 8,
                },
            });
            this.producer = this.kafka.producer();
            this.admin = this.kafka.admin();
        }
    }
    async onModuleInit() {
        if (this.isKafkaEnabled) {
            try {
                await this.connectAdmin();
                await this.connectProducer();
                this.logger.log('Kafka producer and admin initialized successfully');
            }
            catch (error) {
                this.logger.error('Failed to initialize Kafka services', error);
            }
        }
        else {
            this.logger.log('Kafka is disabled. Skipping producer initialization.');
        }
    }
    async onModuleDestroy() {
        if (this.isKafkaEnabled) {
            await this.disconnectProducer();
            await this.disconnectAdmin();
        }
    }
    async connectProducer() {
        try {
            await this.producer.connect();
            this.logger.log('Kafka producer connected');
        }
        catch (error) {
            this.logger.error(`Failed to connect Kafka producer: ${error.message}`, error.stack);
            throw error;
        }
    }
    async disconnectProducer() {
        try {
            await this.producer.disconnect();
            this.logger.log('Kafka producer disconnected');
        }
        catch (error) {
            this.logger.error(`Failed to disconnect Kafka producer: ${error.message}`, error.stack);
        }
    }
    async connectAdmin() {
        try {
            await this.admin.connect();
            this.logger.log('Kafka admin connected');
        }
        catch (error) {
            this.logger.error(`Failed to connect Kafka admin: ${error.message}`, error.stack);
            throw error;
        }
    }
    async disconnectAdmin() {
        try {
            await this.admin.disconnect();
            this.logger.log('Kafka admin disconnected');
        }
        catch (error) {
            this.logger.error(`Failed to disconnect Kafka admin: ${error.message}`, error.stack);
        }
    }
    async ensureTopicExists(topicName) {
        if (!this.isKafkaEnabled) {
            return;
        }
        if (this.topicsCreated.has(topicName)) {
            return;
        }
        try {
            const existingTopics = await this.admin.listTopics();
            if (existingTopics.includes(topicName)) {
                this.topicsCreated.add(topicName);
                this.logger.debug(`Topic ${topicName} already exists`);
                return;
            }
            await this.admin.createTopics({
                topics: [
                    {
                        topic: topicName,
                        numPartitions: 1,
                        replicationFactor: 1,
                    },
                ],
            });
            this.topicsCreated.add(topicName);
            this.logger.log(`Topic ${topicName} created successfully`);
        }
        catch (error) {
            if (error.message && error.message.includes('already exists')) {
                this.topicsCreated.add(topicName);
                this.logger.debug(`Topic ${topicName} already exists`);
                return;
            }
            this.logger.error(`Failed to ensure topic ${topicName} exists: ${error.message}`, error.stack);
            throw error;
        }
    }
    async publishMessage(topic, message, key) {
        if (!this.isKafkaEnabled) {
            this.logger.warn('Kafka is disabled. Skipping message publish.');
            return;
        }
        try {
            await this.ensureTopicExists(topic);
            const payload = {
                topic,
                messages: [
                    {
                        key: key || undefined,
                        value: typeof message === 'string' ? message : JSON.stringify(message),
                    },
                ],
            };
            await this.producer.send(payload);
            this.logger.debug(`Message published to topic: ${topic}`);
        }
        catch (error) {
            this.logger.error(`Failed to publish message to topic ${topic}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async publishSurveyEvent(eventType, surveyData, surveyId) {
        if (!this.isKafkaEnabled) {
            this.logger.warn('Kafka is disabled. Skipping survey event publish.');
            return;
        }
        const topic = this.configService.get('kafka.topic', 'survey-topic');
        let fullEventType = '';
        switch (eventType) {
            case 'created':
                fullEventType = 'SURVEY_CREATED';
                break;
            case 'updated':
                fullEventType = 'SURVEY_UPDATED';
                break;
            case 'published':
                fullEventType = 'SURVEY_PUBLISHED';
                break;
            case 'closed':
                fullEventType = 'SURVEY_CLOSED';
                break;
            case 'deleted':
                fullEventType = 'SURVEY_DELETED';
                break;
            default:
                fullEventType = 'UNKNOWN_EVENT';
                break;
        }
        const payload = {
            eventType: fullEventType,
            timestamp: new Date().toISOString(),
            surveyId,
            data: surveyData
        };
        await this.publishMessage(topic, payload, surveyId);
        this.logger.log(`Survey ${eventType} event published for survey ${surveyId}`);
    }
    async publishResponseEvent(eventType, responseData, responseId) {
        if (!this.isKafkaEnabled) {
            this.logger.warn('Kafka is disabled. Skipping response event publish.');
            return;
        }
        const topic = this.configService.get('kafka.topic', 'survey-topic');
        let fullEventType = '';
        switch (eventType) {
            case 'started':
                fullEventType = 'RESPONSE_STARTED';
                break;
            case 'updated':
                fullEventType = 'RESPONSE_UPDATED';
                break;
            case 'submitted':
                fullEventType = 'RESPONSE_SUBMITTED';
                break;
            default:
                fullEventType = 'UNKNOWN_EVENT';
                break;
        }
        const payload = {
            eventType: fullEventType,
            timestamp: new Date().toISOString(),
            responseId,
            data: responseData
        };
        await this.publishMessage(topic, payload, responseId);
        this.logger.log(`Response ${eventType} event published for response ${responseId}`);
    }
    async publishFileEvent(eventType, fileData, fileId) {
        if (!this.isKafkaEnabled) {
            this.logger.warn('Kafka is disabled. Skipping file event publish.');
            return;
        }
        const topic = this.configService.get('kafka.topic', 'survey-topic');
        let fullEventType = '';
        switch (eventType) {
            case 'uploaded':
                fullEventType = 'FILE_UPLOADED';
                break;
            case 'deleted':
                fullEventType = 'FILE_DELETED';
                break;
            default:
                fullEventType = 'UNKNOWN_EVENT';
                break;
        }
        const payload = {
            eventType: fullEventType,
            timestamp: new Date().toISOString(),
            fileId,
            data: fileData
        };
        await this.publishMessage(topic, payload, fileId);
        this.logger.log(`File ${eventType} event published for file ${fileId}`);
    }
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = KafkaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KafkaService);
//# sourceMappingURL=kafka.service.js.map