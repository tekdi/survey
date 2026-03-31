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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
    }
    async onModuleInit() {
        const host = this.configService.get('redis.host');
        const port = this.configService.get('redis.port');
        const password = this.configService.get('redis.password');
        const maxRetriesPerRequest = this.configService.get('redis.maxRetriesPerRequest');
        this.logger.log(`Initializing Redis connection to ${host}:${port}`);
        this.logger.log('Redis service initialized (client not connected - install ioredis to enable)');
    }
    async onModuleDestroy() {
    }
    async set(key, value, ttlSeconds) {
        this.logger.debug(`SET ${key} = ${value} (TTL: ${ttlSeconds || 'none'})`);
    }
    async get(key) {
        this.logger.debug(`GET ${key}`);
        return null;
    }
    async delete(key) {
        this.logger.debug(`DELETE ${key}`);
    }
    async exists(key) {
        this.logger.debug(`EXISTS ${key}`);
        return false;
    }
    async expire(key, seconds) {
        this.logger.debug(`EXPIRE ${key} ${seconds}`);
    }
    async getOrSet(key, factory, ttlSeconds) {
        this.logger.debug(`GETORSET ${key} (no cache, calling factory)`);
        return await factory();
    }
    async deletePattern(pattern) {
        this.logger.debug(`DELETE PATTERN ${pattern}`);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map