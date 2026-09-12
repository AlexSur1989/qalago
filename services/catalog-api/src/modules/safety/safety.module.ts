import { Module } from '@nestjs/common';
import { CommonAccessModule } from '../../common/common-access.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';
import { ContentReportService } from './content-report.service';
import { DataRightsService } from './data-rights.service';
import { LegalService } from './legal.service';
import { ModerationService } from './moderation.service';
import { RestrictedAdminService } from './restricted-admin.service';
import { SafetyAdminController } from './safety-admin.controller';
import { SafetyController } from './safety.controller';
import { SafetyRateLimitService } from './safety-rate-limit.service';

@Module({
  imports: [CommonAccessModule, AuditLogModule, AuthModule],
  controllers: [SafetyController, SafetyAdminController],
  providers: [
    LegalService,
    ContentReportService,
    DataRightsService,
    ModerationService,
    RestrictedAdminService,
    SafetyRateLimitService,
  ],
  exports: [LegalService, ContentReportService, DataRightsService, ModerationService],
})
export class SafetyModule {}
