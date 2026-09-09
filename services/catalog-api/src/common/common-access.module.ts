import { Global, Module, forwardRef } from '@nestjs/common';
import { BusinessAccessService } from './services/business-access.service';
import { BusinessMembershipService } from './services/business-membership.service';
import { CityScopeService } from './services/city-scope.service';
import { SystemAccessService } from './services/system-access.service';
import { OnboardingRateLimitService } from './services/onboarding-rate-limit.service';
import { AuditLogModule } from '../modules/audit-log/audit-log.module';

@Global()
@Module({
  imports: [forwardRef(() => AuditLogModule)],
  providers: [
    CityScopeService,
    BusinessMembershipService,
    BusinessAccessService,
    SystemAccessService,
    OnboardingRateLimitService,
  ],
  exports: [
    CityScopeService,
    BusinessMembershipService,
    BusinessAccessService,
    SystemAccessService,
    OnboardingRateLimitService,
  ],
})
export class CommonAccessModule {}
