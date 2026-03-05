import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Admin } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private readonly logger = new Logger(KafkaService.name);
  private isKafkaEnabled: boolean;
  private topicsCreated: Set<string> = new Set();

  constructor(private configService: ConfigService) {
    // Retrieve Kafka config from the configuration
    this.isKafkaEnabled = this.configService.get<boolean>('kafka.kafkaEnabled', false);
    const brokers = this.configService.get<string[]>('kafka.brokers', ['localhost:9092']);
    const clientId = this.configService.get<string>('kafka.clientId', 'survey-service');

    // Initialize Kafka client if enabled
    if (this.isKafkaEnabled) {
      this.kafka = new Kafka({
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
      } catch (error) {
        this.logger.error('Failed to initialize Kafka services', error);
      }
    } else {
      this.logger.log('Kafka is disabled. Skipping producer initialization.');
    }
  }

  async onModuleDestroy() {
    if (this.isKafkaEnabled) {
      await this.disconnectProducer();
      await this.disconnectAdmin();
    }
  }

  private async connectProducer() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error(`Failed to connect Kafka producer: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async disconnectProducer() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error(`Failed to disconnect Kafka producer: ${error.message}`, error.stack);
    }
  }

  private async connectAdmin() {
    try {
      await this.admin.connect();
      this.logger.log('Kafka admin connected');
    } catch (error) {
      this.logger.error(`Failed to connect Kafka admin: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async disconnectAdmin() {
    try {
      await this.admin.disconnect();
      this.logger.log('Kafka admin disconnected');
    } catch (error) {
      this.logger.error(`Failed to disconnect Kafka admin: ${error.message}`, error.stack);
    }
  }

  /**
   * Ensure a topic exists, creating it if necessary
   * 
   * @param topicName - The name of the topic to ensure exists
   * @returns A promise that resolves when the topic is confirmed to exist
   */
  private async ensureTopicExists(topicName: string): Promise<void> {
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
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        this.topicsCreated.add(topicName);
        this.logger.debug(`Topic ${topicName} already exists`);
        return;
      }
      
      this.logger.error(`Failed to ensure topic ${topicName} exists: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Publish a message to a Kafka topic
   * 
   * @param topic - The Kafka topic to publish to
   * @param message - The message payload to publish
   * @param key - Optional message key for partitioning
   * @returns A promise that resolves when the message is sent
   */
  async publishMessage(topic: string, message: any, key?: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to publish message to topic ${topic}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Publish a survey-related event to Kafka
   * 
   * @param eventType - The type of survey event (created, updated, published, closed, deleted)
   * @param surveyData - The survey data to include in the event
   * @param surveyId - The ID of the survey (used as the message key)
   */
  async publishSurveyEvent(
    eventType: 'created' | 'updated' | 'published' | 'closed' | 'deleted',
    surveyData: any,
    surveyId: string
  ): Promise<void> {
    if (!this.isKafkaEnabled) {
      this.logger.warn('Kafka is disabled. Skipping survey event publish.');
      return;
    }

    const topic = this.configService.get<string>('kafka.topic', 'survey-topic');
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

  /**
   * Publish a response-related event to Kafka
   * 
   * @param eventType - The type of response event (started, updated, submitted)
   * @param responseData - The response data to include in the event
   * @param responseId - The ID of the response (used as the message key)
   */
  async publishResponseEvent(
    eventType: 'started' | 'updated' | 'submitted',
    responseData: any,
    responseId: string
  ): Promise<void> {
    if (!this.isKafkaEnabled) {
      this.logger.warn('Kafka is disabled. Skipping response event publish.');
      return;
    }

    const topic = this.configService.get<string>('kafka.topic', 'survey-topic');
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

  /**
   * Publish a file upload event to Kafka
   * 
   * @param eventType - The type of file event (uploaded, deleted)
   * @param fileData - The file data to include in the event
   * @param fileId - The ID of the file (used as the message key)
   */
  async publishFileEvent(
    eventType: 'uploaded' | 'deleted',
    fileData: any,
    fileId: string
  ): Promise<void> {
    if (!this.isKafkaEnabled) {
      this.logger.warn('Kafka is disabled. Skipping file event publish.');
      return;
    }

    const topic = this.configService.get<string>('kafka.topic', 'survey-topic');
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
}
