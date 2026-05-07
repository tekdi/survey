import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  // Keycloak JWT validation
  keycloakRsaPublicKey: process.env.KEYCLOAK_REALM_RSA_PUBLIC_KEY || '',

  // Legacy (kept for backward compatibility)
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
}));
