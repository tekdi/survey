import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

/**
 * Extracts and validates tenantid from request headers.
 * Matches user-microservice pattern: @GetTenantId()
 */
export const GetTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.headers['tenantid'];

    if (!tenantId) {
      throw new BadRequestException('tenantid header is required');
    }

    if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      throw new BadRequestException('tenantid must be a non-empty string');
    }

    if (!isUUID(tenantId)) {
      throw new BadRequestException('tenantid must be a valid UUID format');
    }

    return tenantId;
  },
);

// Backward-compatible alias
export const Tenant = GetTenantId;
