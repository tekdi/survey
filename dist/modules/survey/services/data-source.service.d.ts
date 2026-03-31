import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/common/cache/redis.service';
export declare enum DataSourceType {
    STATIC = "static",
    API = "api",
    INTERNAL_API = "internal_api",
    DATABASE = "database"
}
export interface DataSourceConfig {
    type: DataSourceType;
    options?: any[];
    api?: {
        url: string;
        method?: 'GET' | 'POST';
        headers?: Record<string, string>;
        body?: any;
        auth?: {
            type: 'bearer' | 'basic' | 'api_key';
            token?: string;
            username?: string;
            password?: string;
            apiKeyHeader?: string;
            apiKeyValue?: string;
        };
        mapping?: {
            valueField: string;
            labelField: string;
            dataPath?: string;
        };
    };
    cache?: {
        enabled: boolean;
        ttl: number;
    };
    fallback?: any[];
}
export declare class DataSourceService {
    private readonly configService;
    private readonly redisService;
    private readonly logger;
    private readonly defaultTimeout;
    constructor(configService: ConfigService, redisService: RedisService);
    fetchFieldOptions(fieldId: string, dataSourceConfig: DataSourceConfig): Promise<any[]>;
    private fetchStaticOptions;
    private fetchApiOptions;
    private callExternalApi;
    private addAuthentication;
    private extractDataByPath;
    private mapOptions;
    private getCachedOptions;
    private cacheOptions;
    clearFieldOptionsCache(fieldId: string): Promise<void>;
    fetchMultipleFieldOptions(fields: Array<{
        fieldId: string;
        dataSource: DataSourceConfig;
    }>): Promise<Map<string, any[]>>;
}
