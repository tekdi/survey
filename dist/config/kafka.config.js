"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('kafka', () => ({
    kafkaEnabled: process.env.KAFKA_ENABLED === 'true',
    kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
    brokers: (process.env.KAFKA_BROKERS || process.env.KAFKA_HOST || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'survey-service',
    topic: process.env.KAFKA_TOPIC || 'survey-topic',
}));
//# sourceMappingURL=kafka.config.js.map