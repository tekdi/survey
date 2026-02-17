import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet.default());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'tenantid', 'rbac_token'],
  });

  // Global prefix — matches user-microservice pattern: survey/v1
  const apiPrefix = configService.get<string>('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);

  // Global exception filter (matching user-microservice AllExceptionsFilter)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation at /swagger-docs (matching user-microservice)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Survey Service API')
    .setDescription(
      'API for managing surveys, responses, and media uploads with multi-tenant support',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'tenantid', in: 'header' },
      'tenantid',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger-docs', app, document);

  // Start server
  const port = configService.get<number>('app.port');
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/swagger-docs`);
}

bootstrap();
