"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../cache/redis.service");
let ExampleCacheService = class ExampleCacheService {
    constructor(redisService) {
        this.redisService = redisService;
    }
    async cacheUserData(userId, userData) {
        const cacheKey = `user:${userId}`;
        const ttl = 3600;
        await this.redisService.set(cacheKey, JSON.stringify(userData), ttl);
    }
    async getCachedUserData(userId) {
        const cacheKey = `user:${userId}`;
        const cached = await this.redisService.get(cacheKey);
        return cached ? JSON.parse(cached) : null;
    }
    async getUserWithCache(userId) {
        const cacheKey = `user:${userId}`;
        return await this.redisService.getOrSet(cacheKey, async () => {
            return { id: userId, name: 'John Doe' };
        }, 3600);
    }
    async invalidateUserCache(userId) {
        const cacheKey = `user:${userId}`;
        await this.redisService.delete(cacheKey);
    }
    async invalidateAllUserCaches() {
        await this.redisService.deletePattern('user:*');
    }
};
exports.ExampleCacheService = ExampleCacheService;
exports.ExampleCacheService = ExampleCacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], ExampleCacheService);
//# sourceMappingURL=example-cache.service.js.map