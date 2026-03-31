"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('auth', () => ({
    keycloakRsaPublicKey: process.env.KEYCLOAK_REALM_RSA_PUBLIC_KEY || '',
    rbacJwtSecret: process.env.RBAC_JWT_SECRET || '',
    rbacIssuer: process.env.RBAC_JWT_ISSUER || 'survey-service',
    rbacAudience: process.env.RBAC_JWT_AUDIENCE || 'survey-service',
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
}));
//# sourceMappingURL=auth.config.js.map