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

@Entity('survey_master')
@Index('idx_survey_tenant', ['tenant_id'])
@Index('idx_survey_status', ['status'])
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  survey_id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  survey_title: string;

  @Column({ type: 'text', nullable: true })
  survey_description: string;

  @Column({ type: 'enum', enum: SurveyStatus, default: SurveyStatus.DRAFT })
  status: SurveyStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  survey_type: string;

  @Column({ type: 'jsonb', default: {} })
  settings: {
    allowAnonymous?: boolean;
    requireAuth?: boolean;
    maxResponses?: number;
    startDate?: string;
    endDate?: string;
    showProgressBar?: boolean;
    shuffleQuestions?: boolean;
    allowMultipleSubmissions?: boolean;
  };

  @Column({ type: 'jsonb', default: {} })
  theme: {
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    logoUrl?: string;
  };

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'integer', default: 0 })
  version: number;

  @OneToMany(() => SurveySection, (section) => section.survey, {
    cascade: true,
    eager: false,
  })
  sections: SurveySection[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at: Date;
}
