import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: (() => {
    if (!process.env.CORS_ORIGINS?.trim()) return true; // true = reflect any origin
    const list = process.env.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    return list.length > 0 ? list : true;
  })(),
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  tenantMap: {
    // tenantId -> tenantName (used by Excel import reverse lookup)
    '29f8c9a6-032f-48c7-a14a-9e3db3d7b76e': 'Open School',
    '6c8b810a-66c2-4f0d-8c0c-c025415a4414': 'Vocational Training',
    '914ca990-9b45-4385-a06b-05054f35d0b9': 'Pragyanpath',
    'e39447df-069d-4ccf-b92c-576f70b350f3': 'Pratham',
    'e4daf4d5-0ebb-4a97-af59-c06453cceda8': 'Summer Camp',
    'ef99949b-7f3a-4a5f-806a-e67e683e38f3': 'Second Chance Program',
    'fd8f3180-9988-495b-8a0d-ed201d7d28df': 'Camp to Club',
  },
}));
