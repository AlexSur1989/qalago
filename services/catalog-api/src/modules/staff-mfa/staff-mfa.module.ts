import { Module, forwardRef } from '@nestjs/common';
import { CommonAccessModule } from '../../common/common-access.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';
import { StaffMfaChallengeService } from './staff-mfa-challenge.service';
import { StaffMfaController } from './staff-mfa.controller';
import { StaffMfaPolicyService } from './staff-mfa-policy.service';
import { StaffMfaService } from './staff-mfa.service';

@Module({
  imports: [CommonAccessModule, AuditLogModule, forwardRef(() => AuthModule)],
  controllers: [StaffMfaController],
  providers: [StaffMfaService, StaffMfaPolicyService, StaffMfaChallengeService],
  exports: [StaffMfaService, StaffMfaPolicyService, StaffMfaChallengeService],
})
export class StaffMfaModule {}
