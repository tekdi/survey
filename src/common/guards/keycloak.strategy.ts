import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-keycloak') {
  constructor(configService: ConfigService) {
    const publicKey = configService.get('KEYCLOAK_REALM_RSA_PUBLIC_KEY');
    new Logger('JwtStrategy').log(
      `KEYCLOAK_REALM_RSA_PUBLIC_KEY loaded: ${publicKey ? publicKey.substring(0, 80) + '...' : 'NOT SET / EMPTY'}`,
    );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
    });
  }

  async validate(payload: any) {
    /**
     * This can be obtained via req.user in the Controllers
     * This is where we validate that the user is valid and delimit the payload returned to req.user
     */
    return {
      userId: payload.sub,
      name: payload.name,
      username: payload.preferred_username,
    };
  }
}
