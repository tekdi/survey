import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

/**
 * Global Redis Module
 * 
 * This module provides Redis functionality across the application.
 * It uses ConfigService to load Redis configuration instead of direct process.env access.
 * 
 * Usage in other modules:
 * - Just inject RedisService (module is global, no need to import)
 * 
 * @example
 * constructor(private readonly redisService: RedisService) {}
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
