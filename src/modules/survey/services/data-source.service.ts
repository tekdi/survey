import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/common/cache/redis.service';
import axios, { AxiosRequestConfig } from 'axios';

export enum DataSourceType {
  STATIC = 'static', // Hardcoded options in dataSource.options
  API = 'api', // Fetch from external API
  INTERNAL_API = 'internal_api', // Fetch from internal microservice
  DATABASE = 'database', // Fetch from another table (future enhancement)
}

export interface DataSourceConfig {
  type: DataSourceType;
  options?: any[]; // For static options
  api?: {
    url: string; // API endpoint
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: any; // For POST requests
    auth?: {
      type: 'bearer' | 'basic' | 'api_key';
      token?: string;
      username?: string;
      password?: string;
      apiKeyHeader?: string;
      apiKeyValue?: string;
    };
    mapping?: {
      // Map external API response to internal format
      valueField: string; // e.g., 'id', 'code'
      labelField: string; // e.g., 'name', 'title'
      dataPath?: string; // JSONPath to extract data (e.g., 'data.items')
    };
  };
  cache?: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
  };
  fallback?: any[]; // Fallback options if API fails
}

/**
 * DataSourceService handles fetching field options from various sources:
 * 1. Static options (hardcoded in field config)
 * 2. External APIs (3rd party services)
 * 3. Internal APIs (other microservices)
 * 4. Database queries (future)
 */
@Injectable()
export class DataSourceService {
  private readonly logger = new Logger(DataSourceService.name);
  private readonly defaultTimeout = 5000; // 5 seconds

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Fetch options for a survey field based on its dataSource configuration
   */
  async fetchFieldOptions(
    fieldId: string,
    dataSourceConfig: DataSourceConfig,
  ): Promise<any[]> {
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
    } catch (error) {
      this.logger.error(
        `Failed to fetch options for field ${fieldId}: ${error.message}`,
        error.stack,
      );

      // Return fallback options if available
      if (dataSourceConfig.fallback) {
        this.logger.log(`Using fallback options for field ${fieldId}`);
        return dataSourceConfig.fallback;
      }

      return [];
    }
  }

  /**
   * Fetch static options (no external call needed)
   */
  private fetchStaticOptions(config: DataSourceConfig): any[] {
    return config.options || [];
  }

  /**
   * Fetch options from external or internal API
   */
  private async fetchApiOptions(
    fieldId: string,
    config: DataSourceConfig,
  ): Promise<any[]> {
    if (!config.api || !config.api.url) {
      throw new Error('API configuration is missing');
    }

    // Check cache first
    if (config.cache?.enabled) {
      const cached = await this.getCachedOptions(fieldId);
      if (cached) {
        this.logger.debug(`Cache hit for field ${fieldId}`);
        return cached;
      }
    }

    // Make API request
    const options = await this.callExternalApi(config.api);

    // Cache the result
    if (config.cache?.enabled && options.length > 0) {
      await this.cacheOptions(fieldId, options, config.cache.ttl);
    }

    return options;
  }

  /**
   * Make HTTP request to external API
   */
  private async callExternalApi(apiConfig: NonNullable<DataSourceConfig['api']>): Promise<any[]> {
    try {
      const requestConfig: AxiosRequestConfig = {
        url: apiConfig.url,
        method: apiConfig.method || 'GET',
        headers: { ...(apiConfig.headers || {}) },
        timeout: this.defaultTimeout,
      };

      // Add authentication
      if (apiConfig.auth) {
        this.addAuthentication(requestConfig, apiConfig.auth);
      }

      // Add body for POST requests
      if (apiConfig.method === 'POST' && apiConfig.body) {
        requestConfig.data = apiConfig.body;
      }

      this.logger.debug(`Calling external API: ${apiConfig.url}`);
      const response = await axios(requestConfig);

      // Extract data from response
      let data = response.data;

      // Apply data path if specified (e.g., extract from nested object)
      if (apiConfig.mapping?.dataPath) {
        data = this.extractDataByPath(data, apiConfig.mapping.dataPath);
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error('API response is not an array');
      }

      // Map to internal format
      if (apiConfig.mapping) {
        return this.mapOptions(data, apiConfig.mapping);
      }

      return data;
    } catch (error) {
      if (error.response) {
        // API returned error response
        throw new HttpException(
          `External API error: ${error.response.status} - ${error.response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      } else if (error.request) {
        // No response received
        throw new HttpException(
          'External API did not respond',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      } else {
        // Request setup error
        throw error;
      }
    }
  }

  /**
   * Add authentication to request
   */
  private addAuthentication(
    config: AxiosRequestConfig,
    auth: NonNullable<NonNullable<DataSourceConfig['api']>['auth']>,
  ): void {
    if (!config.headers) {
      config.headers = {};
    }

    switch (auth.type) {
      case 'bearer':
        config.headers['Authorization'] = `Bearer ${auth.token}`;
        break;

      case 'basic':
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString(
          'base64',
        );
        config.headers['Authorization'] = `Basic ${credentials}`;
        break;

      case 'api_key':
        config.headers[auth.apiKeyHeader!] = auth.apiKeyValue;
        break;
    }
  }

  /**
   * Extract data from nested object using dot notation
   * Example: "data.items" extracts response.data.items
   */
  private extractDataByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Map external API response to internal format
   * Transforms: [{ id: 1, name: "Option 1" }]
   * To: [{ value: 1, label: "Option 1" }]
   */
  private mapOptions(
    data: any[],
    mapping: NonNullable<NonNullable<DataSourceConfig['api']>['mapping']>,
  ): any[] {
    return data.map((item) => ({
      value: item[mapping.valueField],
      label: item[mapping.labelField],
      // Preserve original data for reference
      _original: item,
    }));
  }

  /**
   * Get cached options from Redis
   */
  private async getCachedOptions(fieldId: string): Promise<any[] | null> {
    try {
      const cacheKey = `field_options:${fieldId}`;
      const cached = await this.redisService.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error(`Cache read error: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache options in Redis
   */
  private async cacheOptions(
    fieldId: string,
    options: any[],
    ttl: number,
  ): Promise<void> {
    try {
      const cacheKey = `field_options:${fieldId}`;
      await this.redisService.set(cacheKey, JSON.stringify(options), ttl);
      this.logger.debug(`Cached options for field ${fieldId} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache write error: ${error.message}`);
    }
  }

  /**
   * Clear cached options for a field (useful after survey update)
   */
  async clearFieldOptionsCache(fieldId: string): Promise<void> {
    try {
      const cacheKey = `field_options:${fieldId}`;
      await this.redisService.delete(cacheKey);
      this.logger.debug(`Cleared cache for field ${fieldId}`);
    } catch (error) {
      this.logger.error(`Cache clear error: ${error.message}`);
    }
  }

  /**
   * Batch fetch options for multiple fields
   */
  async fetchMultipleFieldOptions(
    fields: Array<{ fieldId: string; dataSource: DataSourceConfig }>,
  ): Promise<Map<string, any[]>> {
    const results = new Map<string, any[]>();

    await Promise.all(
      fields.map(async (field) => {
        const options = await this.fetchFieldOptions(
          field.fieldId,
          field.dataSource,
        );
        results.set(field.fieldId, options);
      }),
    );

    return results;
  }
}
