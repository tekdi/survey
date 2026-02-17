import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import {
  appConfig,
  databaseConfig,
  storageConfig,
  authConfig,
  redisConfig,
} from './config';

import { DatabaseModule } from './database/database.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { SurveyModule } from './modules/survey/survey.module';
import { ResponseModule } from './modules/response/response.module';
import { StorageModule } from './modules/storage/storage.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, storageConfig, authConfig, redisConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60000,
        limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
      },
    ]),

    // Database
    DatabaseModule,

    // Feature modules
    TenantModule,
    SurveyModule,
    ResponseModule,
    StorageModule,
    FileUploadModule,
  ],
})
export class AppModule {}
