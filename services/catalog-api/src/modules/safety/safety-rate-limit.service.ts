import { Injectable } from '@nestjs/common';
import { SlidingWindowRateLimitService } from '../../common/services/sliding-window-rate-limit.service';
import {
  SAFETY_APPEAL_USER_LIMIT,
  SAFETY_APPEAL_USER_WINDOW_SECONDS,
  SAFETY_DATA_RIGHTS_USER_LIMIT,
  SAFETY_DATA_RIGHTS_USER_WINDOW_SECONDS,
  SAFETY_REPORT_IP_LIMIT,
  SAFETY_REPORT_IP_WINDOW_SECONDS,
} from './safety.constants';

@Injectable()
export class SafetyRateLimitService {
  constructor(private readonly limiter: SlidingWindowRateLimitService) {}

  assertCanSubmitReport(ip: string): void {
    this.limiter.assertAllowed(
      `safety-report:ip:${ip}`,
      SAFETY_REPORT_IP_LIMIT,
      SAFETY_REPORT_IP_WINDOW_SECONDS * 1000,
      'Too many reports',
    );
  }

  assertCanSubmitAppeal(userId: string): void {
    this.limiter.assertAllowed(
      `safety-appeal:user:${userId}`,
      SAFETY_APPEAL_USER_LIMIT,
      SAFETY_APPEAL_USER_WINDOW_SECONDS * 1000,
      'Too many appeals',
    );
  }

  assertCanSubmitDataRights(userId: string): void {
    this.limiter.assertAllowed(
      `data-rights:user:${userId}`,
      SAFETY_DATA_RIGHTS_USER_LIMIT,
      SAFETY_DATA_RIGHTS_USER_WINDOW_SECONDS * 1000,
      'Too many data requests',
    );
  }
}
