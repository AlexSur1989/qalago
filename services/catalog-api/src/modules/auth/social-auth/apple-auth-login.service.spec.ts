import { HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { SocialAuthRateLimitService } from '../../../common/services/social-auth-rate-limit.service';
import { AppleIdentityTokenVerifierService } from './apple-identity-token-verifier.service';
import { AppleAuthLoginService } from './apple-auth-login.service';
import { SocialAuthLoginService } from './social-auth-login.service';

describe('AppleAuthLoginService', () => {
  let service: AppleAuthLoginService;
  let appleVerifier: { verifyIdentityToken: jest.Mock };
  let socialAuthRateLimit: { assertCanAttemptApple: jest.Mock };
  let socialAuthLogin: { completeSocialLogin: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    appleVerifier = {
      verifyIdentityToken: jest.fn().mockResolvedValue({
        providerUserId: 'apple-sub-1',
        email: 'abc@privaterelay.appleid.com',
        emailVerified: true,
      }),
    };
    socialAuthRateLimit = { assertCanAttemptApple: jest.fn() };
    socialAuthLogin = {
      completeSocialLogin: jest.fn().mockResolvedValue({
        accessToken: 'jwt',
        user: { id: 'u1', phone: null, role: 'USER' },
      }),
    };
    config = {
      get: jest.fn((key: string) => (key === 'app.appleAuthEnabled' ? true : undefined)),
    };

    service = new AppleAuthLoginService(
      config as unknown as ConfigService,
      appleVerifier as unknown as AppleIdentityTokenVerifierService,
      socialAuthRateLimit as unknown as SocialAuthRateLimitService,
      socialAuthLogin as unknown as SocialAuthLoginService,
    );
  });

  it('returns 404 when APPLE_AUTH_ENABLED=false', async () => {
    config.get.mockReturnValue(false);
    await expect(service.loginWithApple('token', '127.0.0.1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('delegates verified claims without initialName', async () => {
    await service.loginWithApple('identity-token', '127.0.0.1');

    expect(socialAuthLogin.completeSocialLogin).toHaveBeenCalledWith({
      provider: AuthProvider.APPLE,
      claims: {
        providerUserId: 'apple-sub-1',
        email: 'abc@privaterelay.appleid.com',
        emailVerified: true,
      },
    });
  });

  it('accepts relay email in verified claims', async () => {
    await service.loginWithApple('token', '127.0.0.1');
    expect(appleVerifier.verifyIdentityToken).toHaveBeenCalledWith('token');
    expect(socialAuthLogin.completeSocialLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        claims: expect.objectContaining({
          email: 'abc@privaterelay.appleid.com',
        }),
      }),
    );
  });

  it('propagates verifier failure', async () => {
    appleVerifier.verifyIdentityToken.mockRejectedValue(
      new UnauthorizedException('Authentication failed'),
    );
    await expect(service.loginWithApple('bad', '127.0.0.1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('enforces rate limiting', async () => {
    socialAuthRateLimit.assertCanAttemptApple.mockImplementation(() => {
      throw new HttpException('Too many requests', 429);
    });
    await expect(service.loginWithApple('token', '127.0.0.1')).rejects.toBeInstanceOf(HttpException);
  });

  it('passes optional first-login display name for new-user initialization only', async () => {
    await service.loginWithApple('identity-token', '127.0.0.1', '  Apple User  ');

    expect(socialAuthLogin.completeSocialLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        initialName: 'Apple User',
      }),
    );
  });
});
