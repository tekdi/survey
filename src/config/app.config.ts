import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: (() => {
    if (!process.env.CORS_ORIGINS?.trim()) return ['*'];
    const list = process.env.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    return list.length > 0 ? list : ['*'];
  })(),
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));
