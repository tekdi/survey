import {
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResponseDto {
  @ApiProperty({ description: 'Survey ID to respond to' })
  @IsUUID()
  surveyId: string;

  @ApiPropertyOptional({ description: 'Response data (fieldId -> value)' })
  @IsOptional()
  @IsObject()
  responseData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  responseMetadata?: Record<string, any>;
}

export class UpdateResponseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  responseData?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  fileUploadIds?: Record<string, string[]>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  responseMetadata?: Record<string, any>;
}

export class SubmitResponseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  responseData?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  fileUploadIds?: Record<string, string[]>;
}
