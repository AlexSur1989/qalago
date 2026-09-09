import { HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { SocialAuthRateLimitService } from '../../../common/services/social-auth-rate-limit.service';
import { GoogleIdTokenVerifierService } from './google-id-token-verifier.service';
import { GoogleAuthLoginService } from './google-auth-login.service';
import { SocialAuthLoginService } from './social-auth-login.service';

describe('GoogleAuthLoginService', () => {
  let service: GoogleAuthLoginService;
  let googleVerifier: { verifyIdToken: jest.Mock };
  let socialAuthRateLimit: { assertCanAttemptGoogle: jest.Mock };
  let socialAuthLogin: { completeSocialLogin: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    googleVerifier = {
      verifyIdToken: jest.fn().mockResolvedValue({
        providerUserId: 'google-sub-1',
        email: 'user@gmail.com',
        emailVerified: true,
        name: 'Google User',
      }),
    };
    socialAuthRateLimit = { assertCanAttemptGoogle: jest.fn() };
    socialAuthLogin = {
      completeSocialLogin: jest.fn().mockResolvedValue({
        accessToken: 'jwt',
        user: { id: 'u1' },
      }),
    };
    config = {
      get: jest.fn((key: string) => (key === 'app.googleAuthEnabled' ? true : undefined)),
    };

    service = new GoogleAuthLoginService(
      config as unknown as ConfigService,
      googleVerifier as unknown as GoogleIdTokenVerifierService,
      socialAuthRateLimit as unknown as SocialAuthRateLimitService,
      socialAuthLogin as unknown as SocialAuthLoginService,
    );
  });

  it('returns 404 when GOOGLE_AUTH_ENABLED=false', async () => {
    config.get.mockReturnValue(false);
    await expect(service.loginWithGoogle('token', '127.0.0.1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('delegates verified claims to shared social login with initialName', async () => {
    await service.loginWithGoogle('id-token', '127.0.0.1');

    expect(socialAuthLogin.completeSocialLogin).toHaveBeenCalledWith({
      provider: AuthProvider.GOOGLE,
      claims: {
        providerUserId: 'google-sub-1',
        email: 'user@gmail.com',
        emailVerified: true,
      },
      initialName: 'Google User',
    });
  });

  it('propagates verifier failure', async () => {
    googleVerifier.verifyIdToken.mockRejectedValue(new UnauthorizedException('Authentication failed'));
    await expect(service.loginWithGoogle('bad', '127.0.0.1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('enforces rate limiting', async () => {
    socialAuthRateLimit.assertCanAttemptGoogle.mockImplementation(() => {
      throw new HttpException('Too many requests', 429);
    });
    await expect(service.loginWithGoogle('token', '127.0.0.1')).rejects.toBeInstanceOf(HttpException);
  });
});
