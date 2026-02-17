import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId =
      request.tenantId ||
      request.headers['x-tenant-id'] ||
      request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // Set tenant context for Row Level Security
    request.tenantId = tenantId;

    // Set PostgreSQL session variable for RLS policies
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );
    } finally {
      await queryRunner.release();
    }

    return true;
  }
}
