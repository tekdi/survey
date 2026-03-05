import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'SurveyFileUploads' })
@Index('idx_file_tenant', ['tenantId'])
@Index('idx_file_survey', ['surveyId'])
@Index('idx_file_response', ['responseId'])
@Index('idx_file_field', ['fieldId'])
@Index('idx_file_uploaded_by', ['uploadedBy'])
export class SurveyFileUpload {
  @PrimaryGeneratedColumn('uuid', { name: 'fileId' })
  fileId: string;

  @Column({ name: 'tenantId', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'surveyId', type: 'uuid' })
  surveyId: string;

  @Column({ name: 'responseId', type: 'uuid', nullable: true })
  responseId: string;

  @Column({ name: 'fieldId', type: 'varchar', length: 100 })
  fieldId: string;

  @Column({ name: 'originalFilename', type: 'varchar', length: 255 })
  originalFilename: string;

  @Column({ name: 'storedFilename', type: 'varchar', length: 255 })
  storedFilename: string;

  @Column({ name: 'filePath', type: 'text' })
  filePath: string;

  @Column({ name: 'fileSize', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'mimeType', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'fileType', type: 'varchar', length: 20 })
  fileType: 'image' | 'video';

  // Optional: Image metadata
  @Column({ name: 'imageWidth', type: 'integer', nullable: true })
  imageWidth: number;

  @Column({ name: 'imageHeight', type: 'integer', nullable: true })
  imageHeight: number;

  @Column({ name: 'imageThumbnailPath', type: 'text', nullable: true })
  imageThumbnailPath: string;

  // Optional: Video metadata
  @Column({ name: 'videoDuration', type: 'integer', nullable: true })
  videoDuration: number;

  @Column({ name: 'videoThumbnailPath', type: 'text', nullable: true })
  videoThumbnailPath: string;

  // Simple status tracking
  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted';

  @Column({ name: 'processingError', type: 'text', nullable: true })
  processingError: string;

  // Audit
  @Column({ name: 'uploadedBy', type: 'uuid' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ name: 'deletedAt', type: 'timestamptz', nullable: true })
  deletedAt: Date;
}
