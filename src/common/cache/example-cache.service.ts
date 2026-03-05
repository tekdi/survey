import { Injectable } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

/**
 * Example Service showing how to use RedisService
 * 
 * This demonstrates the proper pattern for using Redis in your services.
 * The RedisService internally uses ConfigService to get Redis configuration.
 */
@Injectable()
export class ExampleCacheService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Example: Cache user data
   */
  async cacheUserData(userId: string, userData: any): Promise<void> {
    const cacheKey = `user:${userId}`;
    const ttl = 3600; // 1 hour
    
    await this.redisService.set(
      cacheKey,
      JSON.stringify(userData),
      ttl,
    );
  }

  /**
   * Example: Get cached user data
   */
  async getCachedUserData(userId: string): Promise<any | null> {
    const cacheKey = `user:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Example: Cache with fallback pattern
   */
  async getUserWithCache(userId: string): Promise<any> {
    const cacheKey = `user:${userId}`;
    
    return await this.redisService.getOrSet(
      cacheKey,
      async () => {
        // This factory function is only called if cache misses
        // In real app, fetch from database here
        return { id: userId, name: 'John Doe' };
      },
      3600, // TTL in seconds
    );
  }

  /**
   * Example: Invalidate cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const cacheKey = `user:${userId}`;
    await this.redisService.delete(cacheKey);
  }

  /**
   * Example: Invalidate multiple caches by pattern
   */
  async invalidateAllUserCaches(): Promise<void> {
    await this.redisService.deletePattern('user:*');
  }
}
