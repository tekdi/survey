import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  // Keycloak JWT validation
  keycloakRsaPublicKey: process.env.KEYCLOAK_REALM_RSA_PUBLIC_KEY || '',

  // RBAC JWT validation
  rbacJwtSecret: process.env.RBAC_JWT_SECRET || '',
  rbacIssuer: process.env.RBAC_JWT_ISSUER || 'survey-service',
  rbacAudience: process.env.RBAC_JWT_AUDIENCE || 'survey-service',

  // Legacy (kept for backward compatibility)
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION, 10) || 3600,
}));
