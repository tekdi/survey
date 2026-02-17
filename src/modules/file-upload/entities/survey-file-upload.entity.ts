import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('survey_file_uploads')
@Index('idx_file_tenant', ['tenant_id'])
@Index('idx_file_survey', ['survey_id'])
@Index('idx_file_response', ['response_id'])
@Index('idx_file_field', ['field_id'])
@Index('idx_file_uploaded_by', ['uploaded_by'])
export class SurveyFileUpload {
  @PrimaryGeneratedColumn('uuid')
  file_id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'uuid', nullable: true })
  response_id: string;

  @Column({ type: 'varchar', length: 100 })
  field_id: string;

  @Column({ type: 'varchar', length: 255 })
  original_filename: string;

  @Column({ type: 'varchar', length: 255 })
  stored_filename: string;

  @Column({ type: 'text' })
  file_path: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'varchar', length: 20 })
  file_type: 'image' | 'video';

  // Image metadata
  @Column({ type: 'integer', nullable: true })
  image_width: number;

  @Column({ type: 'integer', nullable: true })
  image_height: number;

  @Column({ type: 'text', nullable: true })
  image_thumbnail_path: string;

  // Video metadata
  @Column({ type: 'integer', nullable: true })
  video_duration: number;

  @Column({ type: 'text', nullable: true })
  video_thumbnail_path: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  video_codec: string;

  // Processing status
  @Column({ type: 'varchar', length: 20, default: 'uploading' })
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted';

  @Column({ type: 'text', nullable: true })
  processing_error: string;

  // Security
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  virus_scan_status: 'pending' | 'clean' | 'infected' | 'skipped';

  @Column({ type: 'timestamptz', nullable: true })
  virus_scan_at: Date;

  // Access control
  @Column({ type: 'text', nullable: true })
  access_url: string;

  @Column({ type: 'timestamptz', nullable: true })
  access_url_expires_at: Date;

  // Audit
  @Column({ type: 'uuid' })
  uploaded_by: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
