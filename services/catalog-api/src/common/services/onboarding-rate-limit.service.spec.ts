import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnboardingRateLimitService } from './onboarding-rate-limit.service';

describe('OnboardingRateLimitService', () => {
  function createService(limit = 2, windowSeconds = 60) {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'app.businessApplicationCreateLimit') return limit;
        if (key === 'app.businessApplicationCreateWindowSeconds') return windowSeconds;
        if (key === 'app.businessApplicationSubmitLimit') return limit;
        if (key === 'app.businessApplicationSubmitWindowSeconds') return windowSeconds;
        if (key === 'app.ownershipClaimCreateLimit') return limit;
        if (key === 'app.ownershipClaimCreateWindowSeconds') return windowSeconds;
        return undefined;
      }),
    } as unknown as ConfigService;

    return new OnboardingRateLimitService(config);
  }

  it('allows requests under the limit', () => {
    const service = createService();
    expect(() => service.assertApplicationCreate('user-1')).not.toThrow();
    expect(() => service.assertApplicationCreate('user-1')).not.toThrow();
  });

  it('returns 429 when limit exceeded', () => {
    const service = createService(2);
    service.assertApplicationCreate('user-1');
    service.assertApplicationCreate('user-1');
    expect(() => service.assertApplicationCreate('user-1')).toThrow(HttpException);
    try {
      service.assertApplicationCreate('user-1');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(429);
    }
  });

  it('scopes limits per user', () => {
    const service = createService(1);
    service.assertOwnershipClaimCreate('user-a');
    expect(() => service.assertOwnershipClaimCreate('user-b')).not.toThrow();
  });
});
