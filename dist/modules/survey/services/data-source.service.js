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
var DataSourceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceService = exports.DataSourceType = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../../../common/cache/redis.service");
const axios_1 = require("axios");
var DataSourceType;
(function (DataSourceType) {
    DataSourceType["STATIC"] = "static";
    DataSourceType["API"] = "api";
    DataSourceType["INTERNAL_API"] = "internal_api";
    DataSourceType["DATABASE"] = "database";
})(DataSourceType || (exports.DataSourceType = DataSourceType = {}));
let DataSourceService = DataSourceService_1 = class DataSourceService {
    constructor(configService, redisService) {
        this.configService = configService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(DataSourceService_1.name);
        this.defaultTimeout = 5000;
    }
    async fetchFieldOptions(fieldId, dataSourceConfig) {
        if (!dataSourceConfig || !dataSourceConfig.type) {
            return [];
        }
        try {
            switch (dataSourceConfig.type) {
                case DataSourceType.STATIC:
                    return this.fetchStaticOptions(dataSourceConfig);
                case DataSourceType.API:
                case DataSourceType.INTERNAL_API:
                    return await this.fetchApiOptions(fieldId, dataSourceConfig);
                default:
                    this.logger.warn(`Unsupported data source type: ${dataSourceConfig.type}`);
                    return [];
            }
        }
        catch (error) {
            this.logger.error(`Failed to fetch options for field ${fieldId}: ${error.message}`, error.stack);
            if (dataSourceConfig.fallback) {
                this.logger.log(`Using fallback options for field ${fieldId}`);
                return dataSourceConfig.fallback;
            }
            return [];
        }
    }
    fetchStaticOptions(config) {
        return config.options || [];
    }
    async fetchApiOptions(fieldId, config) {
        if (!config.api || !config.api.url) {
            throw new Error('API configuration is missing');
        }
        if (config.cache?.enabled) {
            const cached = await this.getCachedOptions(fieldId);
            if (cached) {
                this.logger.debug(`Cache hit for field ${fieldId}`);
                return cached;
            }
        }
        const options = await this.callExternalApi(config.api);
        if (config.cache?.enabled && options.length > 0) {
            await this.cacheOptions(fieldId, options, config.cache.ttl);
        }
        return options;
    }
    async callExternalApi(apiConfig) {
        try {
            const requestConfig = {
                url: apiConfig.url,
                method: apiConfig.method || 'GET',
                headers: { ...(apiConfig.headers || {}) },
                timeout: this.defaultTimeout,
            };
            if (apiConfig.auth) {
                this.addAuthentication(requestConfig, apiConfig.auth);
            }
            if (apiConfig.method === 'POST' && apiConfig.body) {
                requestConfig.data = apiConfig.body;
            }
            this.logger.debug(`Calling external API: ${apiConfig.url}`);
            const response = await (0, axios_1.default)(requestConfig);
            let data = response.data;
            if (apiConfig.mapping?.dataPath) {
                data = this.extractDataByPath(data, apiConfig.mapping.dataPath);
            }
            if (!Array.isArray(data)) {
                throw new Error('API response is not an array');
            }
            if (apiConfig.mapping) {
                return this.mapOptions(data, apiConfig.mapping);
            }
            return data;
        }
        catch (error) {
            if (error.response) {
                throw new common_1.HttpException(`External API error: ${error.response.status} - ${error.response.statusText}`, common_1.HttpStatus.BAD_GATEWAY);
            }
            else if (error.request) {
                throw new common_1.HttpException('External API did not respond', common_1.HttpStatus.GATEWAY_TIMEOUT);
            }
            else {
                throw error;
            }
        }
    }
    addAuthentication(config, auth) {
        if (!config.headers) {
            config.headers = {};
        }
        switch (auth.type) {
            case 'bearer':
                config.headers['Authorization'] = `Bearer ${auth.token}`;
                break;
            case 'basic':
                const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
                config.headers['Authorization'] = `Basic ${credentials}`;
                break;
            case 'api_key':
                config.headers[auth.apiKeyHeader] = auth.apiKeyValue;
                break;
        }
    }
    extractDataByPath(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    mapOptions(data, mapping) {
        return data.map((item) => ({
            value: item[mapping.valueField],
            label: item[mapping.labelField],
            _original: item,
        }));
    }
    async getCachedOptions(fieldId) {
        try {
            const cacheKey = `field_options:${fieldId}`;
            const cached = await this.redisService.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            this.logger.error(`Cache read error: ${error.message}`);
            return null;
        }
    }
    async cacheOptions(fieldId, options, ttl) {
        try {
            const cacheKey = `field_options:${fieldId}`;
            await this.redisService.set(cacheKey, JSON.stringify(options), ttl);
            this.logger.debug(`Cached options for field ${fieldId} (TTL: ${ttl}s)`);
        }
        catch (error) {
            this.logger.error(`Cache write error: ${error.message}`);
        }
    }
    async clearFieldOptionsCache(fieldId) {
        try {
            const cacheKey = `field_options:${fieldId}`;
            await this.redisService.delete(cacheKey);
            this.logger.debug(`Cleared cache for field ${fieldId}`);
        }
        catch (error) {
            this.logger.error(`Cache clear error: ${error.message}`);
        }
    }
    async fetchMultipleFieldOptions(fields) {
        const results = new Map();
        await Promise.all(fields.map(async (field) => {
            const options = await this.fetchFieldOptions(field.fieldId, field.dataSource);
            results.set(field.fieldId, options);
        }));
        return results;
    }
};
exports.DataSourceService = DataSourceService;
exports.DataSourceService = DataSourceService = DataSourceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService])
], DataSourceService);
//# sourceMappingURL=data-source.service.js.map