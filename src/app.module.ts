import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import {
  appConfig,
  databaseConfig,
  storageConfig,
  authConfig,
  redisConfig,
  kafkaConfig,
} from './config';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { RedisModule } from './common/cache/redis.module';
import { KafkaModule } from './kafka/kafka.module';
import { SurveyModule } from './modules/survey/survey.module';
import { ResponseModule } from './modules/response/response.module';
import { StorageModule } from './modules/storage/storage.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, storageConfig, authConfig, redisConfig, kafkaConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Serve Survey Builder frontend
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/survey-builder',
      serveStaticOptions: {
        index: ['index.html'],
      },
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('app.throttleTtl', 60000),
          limit: configService.get<number>('app.throttleLimit', 100),
        },
      ],
    }),

    // Database
    DatabaseModule,

    // Common modules
    LoggerModule,
    RedisModule,
    KafkaModule,

    // Core modules
    AuthModule,

    // Feature modules
    SurveyModule,
    ResponseModule,
    StorageModule,
    FileUploadModule,
  ],
})
export class AppModule {}
