import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ResponseStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
}

@Entity('survey_response')
@Index('idx_response_tenant', ['tenant_id'])
@Index('idx_response_survey', ['survey_id'])
@Index('idx_response_respondent', ['respondent_id'])
@Index('idx_response_status', ['status'])
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  response_id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'uuid', nullable: true })
  respondent_id: string;

  @Column({ type: 'enum', enum: ResponseStatus, default: ResponseStatus.IN_PROGRESS })
  status: ResponseStatus;

  @Column({ type: 'jsonb', default: {} })
  response_data: Record<string, any>;
  // Structure: { "field_id": value, "field_id_2": [value1, value2] }

  @Column({ type: 'jsonb', default: {} })
  response_metadata: {
    userAgent?: string;
    ipAddress?: string;
    startedAt?: string;
    completedAt?: string;
    timeSpentSeconds?: number;
    pageHistory?: string[];
    deviceType?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  file_upload_ids: Record<string, string[]>;
  // Structure: { "field_id": ["file_id_1", "file_id_2"] }

  @Column({ type: 'integer', default: 1 })
  submission_version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at: Date;
}
