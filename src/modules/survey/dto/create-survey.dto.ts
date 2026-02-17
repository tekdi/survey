import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldType } from '../entities/survey-field.entity';

export class CreateFieldDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  field_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  field_label: string;

  @ApiProperty({ enum: FieldType })
  @IsEnum(FieldType)
  field_type: FieldType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  help_text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  default_value?: any;

  @ApiPropertyOptional()
  @IsOptional()
  validations?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  data_source?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  upload_config?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  ui_config?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  conditional_logic?: Record<string, any>;
}

export class CreateSectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  section_title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  section_description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  conditional_logic?: Record<string, any>;

  @ApiPropertyOptional({ type: [CreateFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  fields?: CreateFieldDto[];
}

export class CreateSurveyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  survey_title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  survey_description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  survey_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  theme?: Record<string, any>;

  @ApiPropertyOptional({ type: [CreateSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  sections?: CreateSectionDto[];
}
