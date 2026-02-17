import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantStorageQuota } from './entities/tenant-storage-quota.entity';
import { TenantService } from './services/tenant.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantStorageQuota])],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
