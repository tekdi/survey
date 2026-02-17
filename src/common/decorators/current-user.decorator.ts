import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import jwt_decode from 'jwt-decode';

export interface CurrentUserPayload {
  userId: string;
  name: string;
  username: string;
}

/**
 * Extract full user object from JWT (set by Passport strategy on req.user).
 * Usage: @CurrentUser() user or @CurrentUser('userId') userId
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    return data ? user?.[data] : user;
  },
);

/**
 * Extract userId by decoding the Authorization Bearer token.
 * Matches user-microservice pattern: @GetUserId()
 */
export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt_decode(token);
      return decoded?.sub;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  },
);
