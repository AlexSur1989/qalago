import { Global, Module, forwardRef } from '@nestjs/common';
import { BusinessAccessService } from './services/business-access.service';
import { BusinessMembershipService } from './services/business-membership.service';
import { CityScopeService } from './services/city-scope.service';
import { SystemAccessService } from './services/system-access.service';
import { StaffPolicyService } from './services/staff-policy.service';
import { StaffSessionService } from './services/staff-session.service';
import { StaffStepUpService } from './services/staff-step-up.service';
import { OnboardingRateLimitService } from './services/onboarding-rate-limit.service';
import { SlidingWindowRateLimitService } from './services/sliding-window-rate-limit.service';
import { OtpRateLimitService } from './services/otp-rate-limit.service';
import { MfaRateLimitService } from './services/mfa-rate-limit.service';
import { SocialAuthRateLimitService } from './services/social-auth-rate-limit.service';
import { RateLimitStoreService } from './services/rate-limit-store.service';
import { ReviewAggregationService } from './services/review-aggregation.service';
import { BusinessPrimaryLocationService } from './services/business-primary-location.service';
import { AuditLogModule } from '../modules/audit-log/audit-log.module';

@Global()
@Module({
  imports: [forwardRef(() => AuditLogModule)],
  providers: [
    CityScopeService,
    BusinessMembershipService,
    BusinessAccessService,
    SystemAccessService,
    StaffPolicyService,
    StaffSessionService,
    StaffStepUpService,
    OnboardingRateLimitService,
    SlidingWindowRateLimitService,
    OtpRateLimitService,
    MfaRateLimitService,
    SocialAuthRateLimitService,
    RateLimitStoreService,
    ReviewAggregationService,
    BusinessPrimaryLocationService,
  ],
  exports: [
    CityScopeService,
    BusinessMembershipService,
    BusinessAccessService,
    SystemAccessService,
    StaffPolicyService,
    StaffSessionService,
    StaffStepUpService,
    OnboardingRateLimitService,
    SlidingWindowRateLimitService,
    OtpRateLimitService,
    MfaRateLimitService,
    SocialAuthRateLimitService,
    RateLimitStoreService,
    ReviewAggregationService,
    BusinessPrimaryLocationService,
  ],
})
export class CommonAccessModule {}
