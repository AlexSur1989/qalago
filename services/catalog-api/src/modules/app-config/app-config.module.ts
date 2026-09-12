import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AppConfigController } from './app-config.controller';
import { AppConfigService } from './app-config.service';
import { FeatureFlagResolverService } from './feature-flag-resolver.service';
import { MaintenanceGuard } from './maintenance.guard';
import { ReleaseAdminController } from './release-admin.controller';
import { ReleaseAdminService } from './release-admin.service';

@Module({
  imports: [AuditLogModule],
  controllers: [AppConfigController, ReleaseAdminController],
  providers: [
    AppConfigService,
    FeatureFlagResolverService,
    ReleaseAdminService,
    { provide: APP_GUARD, useClass: MaintenanceGuard },
  ],
  exports: [AppConfigService],
})
export class AppConfigModule {}
