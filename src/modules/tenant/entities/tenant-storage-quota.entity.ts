import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('tenant_storage_quota')
export class TenantStorageQuota {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'bigint', default: 10737418240 }) // 10 GB
  max_storage_bytes: number;

  @Column({ type: 'bigint', default: 0 })
  current_storage_bytes: number;

  @Column({ type: 'bigint', default: 104857600 }) // 100 MB
  max_file_size_bytes: number;

  @Column({ type: 'varchar', array: true, default: () => "ARRAY['jpg','jpeg','png','gif','webp']" })
  allowed_image_types: string[];

  @Column({ type: 'varchar', array: true, default: () => "ARRAY['mp4','mov','webm','avi']" })
  allowed_video_types: string[];

  @UpdateDateColumn()
  updated_at: Date;
}
