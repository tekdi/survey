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

@Entity({ name: 'SurveyResponses' })
@Index('idx_response_tenant', ['tenantId'])
@Index('idx_response_survey', ['surveyId'])
@Index('idx_response_respondent', ['respondentId'])
@Index('idx_response_status', ['status'])
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid', { name: 'responseId' })
  responseId: string;

  @Column({ name: 'tenantId', type: 'varchar', length: 50 })
  tenantId: string;

  @Column({ name: 'surveyId', type: 'uuid' })
  surveyId: string;

  @Column({ name: 'respondentId', type: 'uuid', nullable: true })
  respondentId: string;

  @Column({ type: 'enum', enum: ResponseStatus, default: ResponseStatus.IN_PROGRESS })
  status: ResponseStatus;

  @Column({ name: 'responseData', type: 'jsonb', default: {} })
  responseData: Record<string, any>;
  // Structure: { "fieldId": value, "fieldId_2": [value1, value2] }

  @Column({ name: 'responseMetadata', type: 'jsonb', default: {} })
  responseMetadata: {
    userAgent?: string;
    ipAddress?: string;
    startedAt?: string;
    completedAt?: string;
    timeSpentSeconds?: number;
    pageHistory?: string[];
    deviceType?: string;
  };

  @Column({ name: 'fileUploadIds', type: 'jsonb', default: {} })
  fileUploadIds: Record<string, string[]>;
  // Structure: { "fieldId": ["fileId_1", "fileId_2"] }

  @Column({ name: 'submissionVersion', type: 'integer', default: 1 })
  submissionVersion: number;

  @Column({ name: 'createdBy', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updatedBy', type: 'uuid', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ name: 'submittedAt', type: 'timestamptz', nullable: true })
  submittedAt: Date;
}
