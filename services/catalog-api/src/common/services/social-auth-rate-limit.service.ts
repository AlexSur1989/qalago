import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlidingWindowRateLimitService } from './sliding-window-rate-limit.service';

@Injectable()
export class SocialAuthRateLimitService {
  constructor(
    private readonly limiter: SlidingWindowRateLimitService,
    private readonly config: ConfigService,
  ) {}

  assertCanAttemptGoogle(ip: string): void {
    this.assertCanAttemptProvider('google', ip);
  }

  assertCanAttemptApple(ip: string): void {
    this.assertCanAttemptProvider('apple', ip);
  }

  /** Google and Apple share limit/window config; keys are provider-specific for isolation. */
  private assertCanAttemptProvider(provider: 'google' | 'apple', ip: string): void {
    const windowMs =
      (this.config.get<number>('app.socialAuthIpWindowSeconds') ??
        this.config.get<number>('app.googleAuthIpWindowSeconds') ??
        900) * 1000;
    const limit =
      this.config.get<number>('app.socialAuthIpLimit') ??
      this.config.get<number>('app.googleAuthIpLimit') ??
      20;
    this.limiter.assertAllowed(
      `${provider}-auth:ip:${ip}`,
      limit,
      windowMs,
      'Too many requests',
    );
  }
}
