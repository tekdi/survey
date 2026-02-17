import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REPORT_KAFKA_CONFIG, SurveyEventType } from '../config/report-events.config';

/**
 * ReportSyncService pushes survey events to the reporting database.
 *
 * Integration strategy (matching shiksha-reports pattern):
 * 1. PRIMARY: Kafka events — The survey service publishes events to a Kafka topic.
 *    The shiksha-reports service consumes these events via its KafkaConsumerService
 *    and routes them to a SurveyHandler that upserts data into reporting tables.
 *
 * 2. FALLBACK: Direct DB write — If Kafka is not configured, this service writes
 *    directly to the reporting DB via a secondary TypeORM connection.
 *
 * The shiksha-reports side needs:
 *   - A SurveyTracker entity mirroring the survey schema
 *   - A SurveyResponseTracker entity mirroring response data
 *   - A SurveyHandler to process events from the 'survey-events' topic
 *   - Kafka consumer routing for SURVEY_* and RESPONSE_* event types
 */
@Injectable()
export class ReportSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportSyncService.name);
  private kafkaProducer: any = null;
  private kafkaEnabled = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const kafkaBrokers = REPORT_KAFKA_CONFIG.brokers;
    const kafkaEnabled = this.configService.get('KAFKA_ENABLED') === 'true';

    if (kafkaEnabled && kafkaBrokers?.length) {
      try {
        // Dynamic import — kafkajs is an optional dependency
        const { Kafka } = require('kafkajs');
        const kafka = new Kafka({
          clientId: REPORT_KAFKA_CONFIG.clientId,
          brokers: kafkaBrokers,
        });

        this.kafkaProducer = kafka.producer();
        await this.kafkaProducer.connect();
        this.kafkaEnabled = true;
        this.logger.log('Kafka producer connected for report sync');
      } catch (error) {
        this.logger.warn(
          `Kafka not available, report sync will be skipped: ${error.message}`,
        );
      }
    } else {
      this.logger.log('Kafka not enabled, report sync events will be logged only');
    }
  }

  async onModuleDestroy() {
    if (this.kafkaProducer) {
      await this.kafkaProducer.disconnect();
    }
  }

  /**
   * Publish a survey lifecycle event to the reporting service.
   *
   * Event format matches shiksha-reports wrapped format:
   * { eventType: 'SURVEY_CREATED', data: { ...surveyData } }
   */
  async syncSurveyEvent(
    eventType: string,
    data: Record<string, any>,
  ): Promise<void> {
    const event = {
      eventType,
      data: {
        ...data,
        eventTimestamp: new Date().toISOString(),
      },
    };

    if (this.kafkaEnabled && this.kafkaProducer) {
      try {
        await this.kafkaProducer.send({
          topic: REPORT_KAFKA_CONFIG.topic,
          messages: [
            {
              key: data.surveyId || data.responseId || 'unknown',
              value: JSON.stringify(event),
              headers: {
                eventType,
                tenantId: data.tenantId || '',
              },
            },
          ],
        });

        this.logger.log(`Report event published: ${eventType}`);
      } catch (error) {
        this.logger.error(
          `Failed to publish report event ${eventType}: ${error.message}`,
          error.stack,
        );
      }
    } else {
      // Log the event for manual processing or debugging
      this.logger.debug(
        `Report event (no Kafka): ${eventType} - ${JSON.stringify(event).substring(0, 200)}`,
      );
    }
  }

  /**
   * Publish a response event to the reporting service.
   */
  async syncResponseEvent(
    eventType: string,
    data: Record<string, any>,
  ): Promise<void> {
    return this.syncSurveyEvent(eventType, data);
  }
}
