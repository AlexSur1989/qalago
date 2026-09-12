import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { StaffMfaModule } from '../staff-mfa/staff-mfa.module';
import { StaffAccessService } from './staff-access.service';
import { StaffAdminController } from './staff-admin.controller';

@Module({
  imports: [AuthModule, AuditLogModule, forwardRef(() => StaffMfaModule)],
  controllers: [StaffAdminController],
  providers: [StaffAccessService],
  exports: [StaffAccessService],
})
export class StaffModule {}
