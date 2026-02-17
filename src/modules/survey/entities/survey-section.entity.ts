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

@Entity({ name: 'SurveySections' })
@Index('idx_section_survey', ['surveyId'])
export class SurveySection {
  @PrimaryGeneratedColumn('uuid', { name: 'sectionId' })
  sectionId: string;

  @Column({ name: 'surveyId', type: 'uuid' })
  surveyId: string;

  @Column({ name: 'tenantId', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'sectionTitle', type: 'varchar', length: 255 })
  sectionTitle: string;

  @Column({ name: 'sectionDescription', type: 'text', nullable: true })
  sectionDescription: string;

  @Column({ name: 'displayOrder', type: 'integer', default: 0 })
  displayOrder: number;

  @Column({ name: 'isVisible', type: 'boolean', default: true })
  isVisible: boolean;

  @Column({ name: 'conditionalLogic', type: 'jsonb', nullable: true })
  conditionalLogic: Record<string, any>;

  @ManyToOne(() => Survey, (survey) => survey.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @OneToMany(() => SurveyField, (field) => field.section, { cascade: true, eager: false })
  fields: SurveyField[];

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt: Date;
}
