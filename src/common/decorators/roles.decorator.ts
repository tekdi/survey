import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';

/**
 * Extracts user roles from the RBAC token header.
 * The RBAC token carries userData.roles (e.g. ["teacher", "team_leader"]).
 * Falls back to an empty array if the token is missing or invalid.
 *
 * Usage: @GetUserRoles() roles: string[]
 */
export const GetUserRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const rbacToken = request.headers['rbac_token'];

    if (!rbacToken || typeof rbacToken !== 'string') {
      return [];
    }

    try {
      const decoded: any = jwtDecode(rbacToken);
      return decoded?.userData?.roles || [];
    } catch {
      return [];
    }
  },
);
