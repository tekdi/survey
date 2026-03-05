import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ConfigModule,
    // Add any entities you need for Kafka processing here
    // TypeOrmModule.forFeature([SurveyEntity, ResponseEntity])
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
