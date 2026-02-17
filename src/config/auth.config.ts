import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION, 10) || 3600,
}));
