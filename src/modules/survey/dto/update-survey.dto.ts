import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateSurveyDto } from './create-survey.dto';
import { SurveyStatus } from '../entities/survey.entity';

export class UpdateSurveyDto extends PartialType(CreateSurveyDto) {
  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: SurveyStatus;
}
