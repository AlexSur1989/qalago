import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlidingWindowRateLimitService } from './sliding-window-rate-limit.service';

@Injectable()
export class OtpRateLimitService {
  constructor(
    private readonly limiter: SlidingWindowRateLimitService,
    private readonly config: ConfigService,
  ) {}

  assertCanSendCode(phone: string, ip: string): void {
    const cooldownSec = this.config.get<number>('app.otpSendCooldownSeconds') ?? 60;
    const cooldownMs = cooldownSec * 1000;
    const lastSend = this.limiter.getLastTimestamp(this.sendKey(phone));
    if (lastSend != null && Date.now() - lastSend < cooldownMs) {
      throw new HttpException(
        { message: 'Too many requests', statusCode: HttpStatus.TOO_MANY_REQUESTS },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const phoneWindowMs =
      (this.config.get<number>('app.otpSendPhoneWindowSeconds') ?? 3600) * 1000;
    const phoneLimit = this.config.get<number>('app.otpSendPhoneLimit') ?? 5;
    this.limiter.assertAllowed(
      `otp-send:phone:${phone}`,
      phoneLimit,
      phoneWindowMs,
      'Too many requests',
    );

    const ipWindowMs = (this.config.get<number>('app.otpSendIpWindowSeconds') ?? 3600) * 1000;
    const ipLimit = this.config.get<number>('app.otpSendIpLimit') ?? 20;
    this.limiter.assertAllowed(`otp-send:ip:${ip}`, ipLimit, ipWindowMs, 'Too many requests');
  }

  recordSendCode(phone: string): void {
    const cooldownSec = this.config.get<number>('app.otpSendCooldownSeconds') ?? 60;
    this.limiter.assertAllowed(
      this.sendKey(phone),
      1,
      cooldownSec * 1000,
      'Too many requests',
    );
  }

  assertCanVerifyCode(phone: string, ip: string): void {
    const windowMs =
      (this.config.get<number>('app.otpVerifyWindowSeconds') ?? 900) * 1000;
    const maxAttempts = this.config.get<number>('app.otpVerifyMaxAttempts') ?? 5;

    this.limiter.assertAllowed(
      `otp-verify:phone:${phone}`,
      maxAttempts,
      windowMs,
      'Too many requests',
    );
    this.limiter.assertAllowed(
      `otp-verify:ip:${ip}`,
      maxAttempts * 3,
      windowMs,
      'Too many requests',
    );
  }

  recordVerifyFailure(phone: string, ip: string): void {
    const windowMs =
      (this.config.get<number>('app.otpVerifyWindowSeconds') ?? 900) * 1000;
    const maxAttempts = this.config.get<number>('app.otpVerifyMaxAttempts') ?? 5;

    this.limiter.assertAllowed(
      `otp-verify:phone:${phone}`,
      maxAttempts,
      windowMs,
      'Too many requests',
    );
    this.limiter.assertAllowed(
      `otp-verify:ip:${ip}`,
      maxAttempts * 3,
      windowMs,
      'Too many requests',
    );
  }

  clearVerifyAttempts(phone: string, ip: string): void {
    this.limiter.reset(`otp-verify:phone:${phone}`);
    this.limiter.reset(`otp-verify:ip:${ip}`);
  }

  private sendKey(phone: string): string {
    return `otp-send:last:${phone}`;
  }
}
