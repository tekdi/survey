import {
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseStatus } from '../entities/survey-response.entity';

export class CreateResponseDto {
  @ApiProperty({ description: 'Survey ID to respond to' })
  @IsUUID()
  survey_id: string;

  @ApiPropertyOptional({ description: 'Response data (field_id -> value)' })
  @IsOptional()
  @IsObject()
  response_data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  response_metadata?: Record<string, any>;
}

export class UpdateResponseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  response_data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  file_upload_ids?: Record<string, string[]>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  response_metadata?: Record<string, any>;
}

export class SubmitResponseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  response_data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  file_upload_ids?: Record<string, string[]>;
}
