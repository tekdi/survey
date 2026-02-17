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

@Entity('survey_fields')
@Index('idx_field_section', ['section_id'])
@Index('idx_field_survey', ['survey_id'])
export class SurveyField {
  @PrimaryGeneratedColumn('uuid')
  field_id: string;

  @Column({ type: 'uuid' })
  section_id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  field_name: string;

  @Column({ type: 'varchar', length: 255 })
  field_label: string;

  @Column({ type: 'enum', enum: FieldType })
  field_type: FieldType;

  @Column({ type: 'boolean', default: false })
  is_required: boolean;

  @Column({ type: 'integer', default: 0 })
  display_order: number;

  @Column({ type: 'text', nullable: true })
  placeholder: string;

  @Column({ type: 'text', nullable: true })
  help_text: string;

  @Column({ type: 'jsonb', nullable: true })
  default_value: any;

  @Column({ type: 'jsonb', default: {} })
  validations: {
    required?: { value: boolean; message?: string };
    minLength?: { value: number; message?: string };
    maxLength?: { value: number; message?: string };
    min?: { value: number; message?: string };
    max?: { value: number; message?: string };
    pattern?: { value: string; message?: string };
    minFiles?: { value: number; message?: string };
    maxFiles?: { value: number; message?: string };
    maxDuration?: { value: number; message?: string };
  };

  @Column({ type: 'jsonb', nullable: true })
  data_source: {
    type: 'static' | 'api' | 'upload';
    options?: Array<{ label: string; value: string }>;
    apiEndpoint?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  upload_config: {
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number;
    allowedTypes?: string[];
    captureMode?: 'file' | 'camera' | 'both';
    thumbnailPreview?: boolean;
    compressionQuality?: number;
  };

  @Column({ type: 'jsonb', default: {} })
  ui_config: {
    layout?: string;
    columns?: number;
    showFilename?: boolean;
    showFileSize?: boolean;
    allowReorder?: boolean;
    showProgress?: boolean;
    showPreview?: boolean;
    width?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  conditional_logic: {
    conditions?: Array<{
      fieldId: string;
      operator: string;
      value: any;
    }>;
    action?: 'show' | 'hide' | 'require';
  };

  @ManyToOne(() => SurveySection, (section) => section.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: SurveySection;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
