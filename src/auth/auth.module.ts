import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/common/guards/keycloak.strategy';
import { RbacJwtStrategy } from '@/common/guards/rbac.strategy';

/**
 * Auth module — mirrors user-microservice auth pattern.
 *
 * Auth flow:
 * 1. User authenticates via user-microservice (Keycloak login → /auth/login)
 * 2. User gets RBAC token from user-microservice (/auth/rbac/token)
 * 3. Survey service validates both tokens:
 *    - Authorization: Bearer <keycloak_jwt> → validated by JwtStrategy (RSA public key)
 *    - rbac_token: <rbac_jwt> → validated by RbacJwtStrategy (RBAC_JWT_SECRET)
 *
 * No login/logout endpoints here — those live in user-microservice.
 */
@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, RbacJwtStrategy],
  exports: [JwtStrategy, RbacJwtStrategy],
})
export class AuthModule {}
