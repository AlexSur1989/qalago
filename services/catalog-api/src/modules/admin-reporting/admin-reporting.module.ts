import { Module } from '@nestjs/common';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AdminReportingController } from './admin-reporting.controller';
import { AdminReportingService } from './admin-reporting.service';
import { ReportingExportService } from './reporting-export.service';
import { ReportingQueryService } from './reporting-query.service';
import { ReportingScopeService } from './reporting-scope.service';

@Module({
  imports: [AppConfigModule, AuditLogModule],
  controllers: [AdminReportingController],
  providers: [
    AdminReportingService,
    ReportingQueryService,
    ReportingScopeService,
    ReportingExportService,
  ],
})
export class AdminReportingModule {}
