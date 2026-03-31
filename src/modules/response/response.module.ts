import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyResponse } from './entities/survey-response.entity';
import { ResponseService } from './services/response.service';
import { ResponseController } from './controllers/response.controller';
import { SurveyModule } from '../survey/survey.module';
import { KafkaModule } from '@/kafka/kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyResponse]), SurveyModule, KafkaModule],
  controllers: [ResponseController],
  providers: [ResponseService],
  exports: [ResponseService],
})
export class ResponseModule {}
