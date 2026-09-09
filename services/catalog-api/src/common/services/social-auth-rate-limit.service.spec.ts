import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialAuthRateLimitService } from './social-auth-rate-limit.service';
import { SlidingWindowRateLimitService } from './sliding-window-rate-limit.service';

describe('SocialAuthRateLimitService', () => {
  let limiter: { assertAllowed: jest.Mock };
  let config: { get: jest.Mock };
  let service: SocialAuthRateLimitService;

  beforeEach(() => {
    limiter = { assertAllowed: jest.fn() };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'app.googleAuthIpLimit') return 20;
        if (key === 'app.googleAuthIpWindowSeconds') return 900;
        return undefined;
      }),
    };
    service = new SocialAuthRateLimitService(
      limiter as unknown as SlidingWindowRateLimitService,
      config as unknown as ConfigService,
    );
  });

  it('applies IP sliding window for Google auth', () => {
    service.assertCanAttemptGoogle('203.0.113.10');
    expect(limiter.assertAllowed).toHaveBeenCalledWith(
      'google-auth:ip:203.0.113.10',
      20,
      900_000,
      'Too many requests',
    );
  });

  it('applies IP sliding window for Apple auth with provider-specific key', () => {
    service.assertCanAttemptApple('203.0.113.11');
    expect(limiter.assertAllowed).toHaveBeenCalledWith(
      'apple-auth:ip:203.0.113.11',
      20,
      900_000,
      'Too many requests',
    );
  });

  it('propagates rate limit errors', () => {
    limiter.assertAllowed.mockImplementation(() => {
      throw new HttpException('Too many requests', 429);
    });
    expect(() => service.assertCanAttemptGoogle('127.0.0.1')).toThrow(HttpException);
  });
});
