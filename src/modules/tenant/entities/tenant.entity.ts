import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  tenant_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  domain: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
