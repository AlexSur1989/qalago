import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpRateLimitService } from './otp-rate-limit.service';
import { SlidingWindowRateLimitService } from './sliding-window-rate-limit.service';

describe('OtpRateLimitService', () => {
  let service: OtpRateLimitService;
  let limiter: SlidingWindowRateLimitService;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimitService();
    const config = {
      get: jest.fn((key: string) => {
        const map: Record<string, number> = {
          'app.otpSendCooldownSeconds': 60,
          'app.otpSendPhoneLimit': 3,
          'app.otpSendPhoneWindowSeconds': 3600,
          'app.otpSendIpLimit': 10,
          'app.otpSendIpWindowSeconds': 3600,
          'app.otpVerifyMaxAttempts': 3,
          'app.otpVerifyWindowSeconds': 900,
        };
        return map[key];
      }),
    } as unknown as ConfigService;
    service = new OtpRateLimitService(limiter, config);
  });

  it('enforces resend cooldown per phone', () => {
    service.assertCanSendCode('+77001234567', '1.1.1.1');
    service.recordSendCode('+77001234567');

    expect(() => service.assertCanSendCode('+77001234567', '1.1.1.1')).toThrow(HttpException);
  });

  it('does not block unrelated phones on send cooldown', () => {
    service.assertCanSendCode('+77001234567', '1.1.1.1');
    service.recordSendCode('+77001234567');

    expect(() => service.assertCanSendCode('+77009998877', '1.1.1.1')).not.toThrow();
  });

  it('enforces send limit per phone', () => {
    for (let i = 0; i < 3; i++) {
      limiter.reset('otp-send:last:+77001234567');
      service.assertCanSendCode('+77001234567', '1.1.1.1');
      service.recordSendCode('+77001234567');
    }

    limiter.reset('otp-send:last:+77001234567');
    expect(() => service.assertCanSendCode('+77001234567', '1.1.1.1')).toThrow(HttpException);
  });

  it('enforces verify failure limit', () => {
    service.recordVerifyFailure('+77001234567', '1.1.1.1');
    service.recordVerifyFailure('+77001234567', '1.1.1.1');
    service.recordVerifyFailure('+77001234567', '1.1.1.1');

    expect(() => service.assertCanVerifyCode('+77001234567', '1.1.1.1')).toThrow(HttpException);
  });

  it('clears verify counters on success', () => {
    service.recordVerifyFailure('+77001234567', '1.1.1.1');
    service.recordVerifyFailure('+77001234567', '1.1.1.1');
    service.clearVerifyAttempts('+77001234567', '1.1.1.1');

    expect(() => service.assertCanVerifyCode('+77001234567', '1.1.1.1')).not.toThrow();
  });
});
