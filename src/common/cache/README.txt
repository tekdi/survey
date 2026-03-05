# Redis Configuration with ConfigService

This directory contains the Redis module that properly uses NestJS ConfigService instead of direct `process.env` access.

## Architecture

```
src/
├── config/
│   └── redis.config.ts          # Redis configuration (loads from env)
└── common/
    └── cache/
        ├── redis.module.ts       # Redis module (Global)
        ├── redis.service.ts      # Redis service (uses ConfigService)
        └── example-cache.service.ts  # Usage examples
```

## How It Works

### 1. Configuration Definition (`redis.config.ts`)

```typescript
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
}));
```

**Note:** Using `process.env` here is correct! This file **defines** the configuration by reading environment variables **once** at startup.

### 2. Configuration Loading (`app.module.ts`)

The Redis config is loaded globally:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig, databaseConfig, storageConfig, authConfig, redisConfig],
});
```

### 3. Configuration Usage (`redis.service.ts`)

The service uses `ConfigService` to **read** the configuration:

```typescript
constructor(private readonly configService: ConfigService) {}

async onModuleInit() {
  // ✅ CORRECT: Use ConfigService
  const host = this.configService.get<string>('redis.host');
  const port = this.configService.get<number>('redis.port');
  
  // ❌ WRONG: Don't use process.env directly
  // const host = process.env.REDIS_HOST;
}
```

## Setup Instructions

### 1. Install Redis Client (Optional)

If you want to actually use Redis:

```bash
npm install ioredis
npm install -D @types/ioredis
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here
REDIS_TTL=3600
REDIS_MAX_RETRIES=3
```

### 3. Enable Redis Client

Once `ioredis` is installed, uncomment the Redis client code in `redis.service.ts`.

## Usage in Your Services

Since `RedisModule` is marked as `@Global()`, you can inject `RedisService` anywhere without importing the module:

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../common/cache/redis.service';

@Injectable()
export class YourService {
  constructor(private readonly redisService: RedisService) {}

  async example() {
    // Set a value with 1 hour TTL
    await this.redisService.set('mykey', 'myvalue', 3600);
    
    // Get a value
    const value = await this.redisService.get('mykey');
    
    // Cache with fallback
    const data = await this.redisService.getOrSet(
      'expensive-query',
      async () => {
        // This only runs on cache miss
        return await this.fetchExpensiveData();
      },
      3600,
    );
  }
}
```

## Benefits of This Approach

1. **✅ Centralized Configuration**: All Redis config in one place
2. **✅ Type Safe**: TypeScript knows the types of config values
3. **✅ Testable**: Easy to mock ConfigService in tests
4. **✅ Environment-aware**: Different configs for dev/prod
5. **✅ No Direct `process.env`**: Services don't access `process.env` directly
6. **✅ Validation Ready**: Can add class-validator for config validation

## Comparison

### ❌ OLD WAY (Direct process.env)

```typescript
// In your service
constructor() {
  const host = process.env.REDIS_HOST || 'localhost'; // BAD
}
```

**Problems:**
- Scattered throughout codebase
- Hard to test
- No type safety
- No validation

### ✅ NEW WAY (ConfigService)

```typescript
// In redis.config.ts (ONCE)
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
}));

// In your service (EVERYWHERE ELSE)
constructor(private configService: ConfigService) {
  const host = this.configService.get<string>('redis.host'); // GOOD
}
```

**Benefits:**
- Single source of truth
- Easy to test (mock ConfigService)
- Type safe
- Can be validated

## References

- [NestJS Configuration Documentation](https://docs.nestjs.com/techniques/configuration)
- [NestJS Configuration Namespaces](https://docs.nestjs.com/techniques/configuration#configuration-namespaces)
- [ioredis Documentation](https://github.com/redis/ioredis)
