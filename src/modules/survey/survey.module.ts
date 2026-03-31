import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Survey } from './entities/survey.entity';
import { SurveySection } from './entities/survey-section.entity';
import { SurveyField } from './entities/survey-field.entity';
import { SurveyService } from './services/survey.service';
import { DataSourceService } from './services/data-source.service';
import { SurveyController } from './controllers/survey.controller';
import { KafkaModule } from '@/kafka/kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, SurveySection, SurveyField]), KafkaModule],
  controllers: [SurveyController],
  providers: [SurveyService, DataSourceService],
  exports: [SurveyService, DataSourceService],
})
export class SurveyModule {}
