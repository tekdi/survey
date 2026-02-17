import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SurveySection } from './survey-section.entity';

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  RATING = 'rating',
  SCALE = 'scale',
  IMAGE_UPLOAD = 'image_upload',
  VIDEO_UPLOAD = 'video_upload',
  FILE_UPLOAD = 'file_upload',
  SIGNATURE = 'signature',
  LOCATION = 'location',
  MATRIX = 'matrix',
}

@Entity({ name: 'SurveyFields' })
@Index('idx_field_section', ['sectionId'])
@Index('idx_field_survey', ['surveyId'])
export class SurveyField {
  @PrimaryGeneratedColumn('uuid', { name: 'fieldId' })
  fieldId: string;

  @Column({ name: 'sectionId', type: 'uuid' })
  sectionId: string;

  @Column({ name: 'surveyId', type: 'uuid' })
  surveyId: string;

  @Column({ name: 'tenantId', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'fieldName', type: 'varchar', length: 100 })
  fieldName: string;

  @Column({ name: 'fieldLabel', type: 'varchar', length: 255 })
  fieldLabel: string;

  @Column({ name: 'fieldType', type: 'varchar', length: 30 })
  fieldType: FieldType;

  @Column({ name: 'isRequired', type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ name: 'displayOrder', type: 'integer', default: 0 })
  displayOrder: number;

  @Column({ name: 'placeholder', type: 'text', nullable: true })
  placeholder: string;

  @Column({ name: 'helpText', type: 'text', nullable: true })
  helpText: string;

  @Column({ name: 'defaultValue', type: 'jsonb', nullable: true })
  defaultValue: any;

  @Column({ name: 'validations', type: 'jsonb', default: {} })
  validations: Record<string, any>;

  @Column({ name: 'dataSource', type: 'jsonb', nullable: true })
  dataSource: Record<string, any>;

  @Column({ name: 'uploadConfig', type: 'jsonb', nullable: true })
  uploadConfig: Record<string, any>;

  @Column({ name: 'uiConfig', type: 'jsonb', default: {} })
  uiConfig: Record<string, any>;

  @Column({ name: 'conditionalLogic', type: 'jsonb', nullable: true })
  conditionalLogic: Record<string, any>;

  @ManyToOne(() => SurveySection, (section) => section.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectionId' })
  section: SurveySection;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt: Date;
}
