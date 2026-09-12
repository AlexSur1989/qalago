import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlidingWindowRateLimitService } from './sliding-window-rate-limit.service';

@Injectable()
export class MfaRateLimitService {
  constructor(
    private readonly limiter: SlidingWindowRateLimitService,
    private readonly config: ConfigService,
  ) {}

  assertCanVerify(userId: string, ip: string): void {
    const windowMs =
      (this.config.get<number>('app.mfaVerifyWindowSeconds') ?? 900) * 1000;
    const maxAttempts = this.config.get<number>('app.mfaVerifyMaxAttempts') ?? 10;
    this.limiter.assertAllowed(
      `mfa-verify:user:${userId}`,
      maxAttempts,
      windowMs,
      'Too many MFA attempts',
    );
    this.limiter.assertAllowed(
      `mfa-verify:ip:${ip}`,
      maxAttempts * 2,
      windowMs,
      'Too many MFA attempts',
    );
  }

  recordVerifyFailure(userId: string, ip: string): void {
    const windowMs =
      (this.config.get<number>('app.mfaVerifyWindowSeconds') ?? 900) * 1000;
    this.limiter.assertAllowed(
      `mfa-verify:user:${userId}`,
      999,
      windowMs,
      'Too many MFA attempts',
    );
    this.limiter.assertAllowed(
      `mfa-verify:ip:${ip}`,
      999,
      windowMs,
      'Too many MFA attempts',
    );
  }

  clearVerifyAttempts(userId: string, ip: string): void {
    this.limiter.reset(`mfa-verify:user:${userId}`);
    this.limiter.reset(`mfa-verify:ip:${ip}`);
  }

  assertCanEnrollVerify(userId: string): void {
    const windowMs = 600_000;
    this.limiter.assertAllowed(
      `mfa-enroll-verify:${userId}`,
      8,
      windowMs,
      'Too many enrollment attempts',
    );
  }
}
