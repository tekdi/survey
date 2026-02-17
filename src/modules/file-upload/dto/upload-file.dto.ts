import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ description: 'Field ID this file belongs to' })
  @IsString()
  fieldId: string;

  @ApiPropertyOptional({ description: 'Response ID (if file is part of a response)' })
  @IsOptional()
  @IsUUID()
  responseId?: string;
}

export class InitChunkedUploadDto {
  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  chunkSize: number;

  @ApiProperty()
  @IsString()
  fieldId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  responseId?: string;
}
