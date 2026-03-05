import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Centralized Database Module
 *
 * This is the SINGLE place where the DB connection is configured for the entire app.
 * All feature modules use TypeOrmModule.forFeature() to register their entities,
 * but the connection itself is managed here via TypeOrmModule.forRootAsync().
 *
 * DB env vars are read from config/database.config.ts (via NestJS ConfigModule).
 * The database/data-source.ts file is only used for TypeORM CLI migrations.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('database.synchronize', false),
        logging: configService.get<boolean>('database.logging', false),
        ssl: configService.get<boolean>('database.ssl', false)
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
