import { RedisService } from '../cache/redis.service';
export declare class ExampleCacheService {
    private readonly redisService;
    constructor(redisService: RedisService);
    cacheUserData(userId: string, userData: any): Promise<void>;
    getCachedUserData(userId: string): Promise<any | null>;
    getUserWithCache(userId: string): Promise<any>;
    invalidateUserCache(userId: string): Promise<void>;
    invalidateAllUserCaches(): Promise<void>;
}
