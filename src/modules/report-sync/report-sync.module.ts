import { Module, Global } from '@nestjs/common';
import { ReportSyncService } from './services/report-sync.service';

@Global()
@Module({
  providers: [ReportSyncService],
  exports: [ReportSyncService],
})
export class ReportSyncModule {}
