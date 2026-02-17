import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Survey } from './entities/survey.entity';
import { SurveySection } from './entities/survey-section.entity';
import { SurveyField } from './entities/survey-field.entity';
import { SurveyService } from './services/survey.service';
import { SurveyController } from './controllers/survey.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, SurveySection, SurveyField])],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService],
})
export class SurveyModule {}
