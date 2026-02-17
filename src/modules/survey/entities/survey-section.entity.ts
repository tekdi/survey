import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Survey } from './survey.entity';
import { SurveyField } from './survey-field.entity';

@Entity('survey_sections')
@Index('idx_section_survey', ['survey_id'])
export class SurveySection {
  @PrimaryGeneratedColumn('uuid')
  section_id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  section_title: string;

  @Column({ type: 'text', nullable: true })
  section_description: string;

  @Column({ type: 'integer', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: true })
  is_visible: boolean;

  @Column({ type: 'jsonb', nullable: true })
  conditional_logic: {
    conditions?: Array<{
      fieldId: string;
      operator: string;
      value: any;
    }>;
    action?: 'show' | 'hide';
  };

  @ManyToOne(() => Survey, (survey) => survey.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @OneToMany(() => SurveyField, (field) => field.section, {
    cascade: true,
    eager: false,
  })
  fields: SurveyField[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
