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

  // Security — disable CSP for Survey Builder (inline scripts/event handlers)
  // All other Helmet protections (X-Frame-Options, HSTS, etc.) remain active
  app.use(
    helmet.default({
      contentSecurityPolicy: false,
    }),
  );
  
  // Get CORS origins from config
  const corsOrigins = configService.get<string[] | string>('app.corsOrigins', '*');
  
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'tenantid',
      'academicyearid',
      'rbac_token',
    ],
  });

  // Global prefix — matches user-microservice pattern: survey/v1
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
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
  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/swagger-docs`);
  logger.log(`Survey Builder: http://localhost:${port}/survey-builder`);
}

bootstrap();
