import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis Service
 * 
 * Provides Redis operations using configuration from ConfigService.
 * This is a placeholder implementation that shows the proper pattern.
 * 
 * To use Redis:
 * 1. Install: npm install ioredis
 * 2. Uncomment the Redis client code below
 * 3. Use the methods in your services
 * 
 * @example
 * // In your service:
 * constructor(private readonly redisService: RedisService) {}
 * 
 * async someMethod() {
 *   await this.redisService.set('key', 'value', 3600);
 *   const value = await this.redisService.get('key');
 * }
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  // private client: Redis; // Uncomment when ioredis is installed

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Get Redis config from ConfigService (NOT from process.env)
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port');
    const password = this.configService.get<string>('redis.password');
    const maxRetriesPerRequest = this.configService.get<number>('redis.maxRetriesPerRequest');

    this.logger.log(`Initializing Redis connection to ${host}:${port}`);

    // Uncomment when ioredis is installed:
    /*
    this.client = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });
    */

    // For now, just log the configuration
    this.logger.log('Redis service initialized (client not connected - install ioredis to enable)');
  }

  async onModuleDestroy() {
    // Uncomment when ioredis is installed:
    /*
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
    */
  }

  /**
   * Set a key-value pair in Redis with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    // Uncomment when ioredis is installed:
    /*
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
    */
    this.logger.debug(`SET ${key} = ${value} (TTL: ${ttlSeconds || 'none'})`);
  }

  /**
   * Get a value from Redis by key
   */
  async get(key: string): Promise<string | null> {
    // Uncomment when ioredis is installed:
    /*
    return await this.client.get(key);
    */
    this.logger.debug(`GET ${key}`);
    return null;
  }

  /**
   * Delete a key from Redis
   */
  async delete(key: string): Promise<void> {
    // Uncomment when ioredis is installed:
    /*
    await this.client.del(key);
    */
    this.logger.debug(`DELETE ${key}`);
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    // Uncomment when ioredis is installed:
    /*
    const result = await this.client.exists(key);
    return result === 1;
    */
    this.logger.debug(`EXISTS ${key}`);
    return false;
  }

  /**
   * Set expiration time on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    // Uncomment when ioredis is installed:
    /*
    await this.client.expire(key, seconds);
    */
    this.logger.debug(`EXPIRE ${key} ${seconds}`);
  }

  /**
   * Get/Set pattern for caching
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    // Uncomment when ioredis is installed:
    /*
    const cached = await this.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const value = await factory();
    await this.set(key, JSON.stringify(value), ttlSeconds);
    return value;
    */

    // Fallback: just call factory (no caching)
    this.logger.debug(`GETORSET ${key} (no cache, calling factory)`);
    return await factory();
  }

  /**
   * Delete keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    // Uncomment when ioredis is installed:
    /*
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
    */
    this.logger.debug(`DELETE PATTERN ${pattern}`);
  }
}
