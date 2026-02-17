import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { TenantStorageQuota } from '../entities/tenant-storage-quota.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantStorageQuota)
    private readonly quotaRepo: Repository<TenantStorageQuota>,
  ) {}

  async findById(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }
    return tenant;
  }

  async getStorageQuota(tenantId: string): Promise<TenantStorageQuota> {
    let quota = await this.quotaRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!quota) {
      // Create default quota
      quota = this.quotaRepo.create({ tenant_id: tenantId });
      await this.quotaRepo.save(quota);
    }

    return quota;
  }

  async checkStorageAvailable(
    tenantId: string,
    requiredBytes: number,
  ): Promise<boolean> {
    const quota = await this.getStorageQuota(tenantId);
    return (
      Number(quota.current_storage_bytes) + requiredBytes <=
      Number(quota.max_storage_bytes)
    );
  }
}
