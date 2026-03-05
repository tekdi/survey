// config/kafka.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => ({
  kafkaEnabled: process.env.KAFKA_ENABLED === 'true',
  kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
  brokers: (process.env.KAFKA_BROKERS || process.env.KAFKA_HOST || 'localhost:9092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'survey-service',
  topic: process.env.KAFKA_TOPIC || 'survey-topic',
}));
