import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SurveySection } from './survey-section.entity';

export enum SurveyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

/**
 * Defines what entity the survey responses are filled against.
 * e.g. Teacher fills consent form against each "learner",
 *      Admin fills infrastructure audit against a "center".
 */
export enum SurveyContextType {
  LEARNER = 'learner',       // Fill per student/learner
  CENTER = 'center',         // Fill per school/center
  TEACHER = 'teacher',       // Fill per teacher
  SELF = 'self',             // Fill for yourself (no external context)
  NONE = 'none',             // General survey, no specific context
}

@Entity({ name: 'SurveyMaster' })
@Index('idx_survey_tenant', ['tenantId'])
@Index('idx_survey_status', ['status'])
@Index('idx_survey_target_roles', ['targetRoles'])
export class Survey {
  @PrimaryGeneratedColumn('uuid', { name: 'surveyId' })
  surveyId: string;

  @Column({ name: 'tenantId', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'surveyTitle', type: 'varchar', length: 255 })
  surveyTitle: string;

  @Column({ name: 'surveyDescription', type: 'text', nullable: true })
  surveyDescription: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: SurveyStatus.DRAFT })
  status: SurveyStatus;

  @Column({ name: 'surveyType', type: 'varchar', length: 50, nullable: true })
  surveyType: string;

  @Column({ name: 'settings', type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ name: 'theme', type: 'jsonb', default: {} })
  theme: Record<string, any>;

  @Column({ name: 'targetRoles', type: 'jsonb', nullable: true })
  targetRoles: string[] | null;

  @Column({ name: 'contextType', type: 'varchar', length: 30, default: SurveyContextType.NONE })
  contextType: SurveyContextType;

  @Column({ name: 'createdBy', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updatedBy', type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ name: 'version', type: 'integer', default: 0 })
  version: number;

  @OneToMany(() => SurveySection, (section) => section.survey, { cascade: true, eager: false })
  sections: SurveySection[];

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ name: 'publishedAt', type: 'timestamp with time zone', nullable: true })
  publishedAt: Date;

  @Column({ name: 'closedAt', type: 'timestamp with time zone', nullable: true })
  closedAt: Date;
}
