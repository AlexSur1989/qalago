import { Global, Module, forwardRef } from '@nestjs/common';
import { BusinessAccessService } from './services/business-access.service';
import { BusinessMembershipService } from './services/business-membership.service';
import { CityScopeService } from './services/city-scope.service';
import { SystemAccessService } from './services/system-access.service';
import { OnboardingRateLimitService } from './services/onboarding-rate-limit.service';
import { SlidingWindowRateLimitService } from './services/sliding-window-rate-limit.service';
import { OtpRateLimitService } from './services/otp-rate-limit.service';
import { SocialAuthRateLimitService } from './services/social-auth-rate-limit.service';
import { RateLimitStoreService } from './services/rate-limit-store.service';
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
    SlidingWindowRateLimitService,
    OtpRateLimitService,
    SocialAuthRateLimitService,
    RateLimitStoreService,
  ],
  exports: [
    CityScopeService,
    BusinessMembershipService,
    BusinessAccessService,
    SystemAccessService,
    OnboardingRateLimitService,
    SlidingWindowRateLimitService,
    OtpRateLimitService,
    SocialAuthRateLimitService,
    RateLimitStoreService,
  ],
})
export class CommonAccessModule {}
