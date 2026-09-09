import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { SocialAuthRateLimitService } from '../../../common/services/social-auth-rate-limit.service';
import { AppleIdentityTokenVerifierService } from './apple-identity-token-verifier.service';
import { SocialAuthLoginService } from './social-auth-login.service';

@Injectable()
export class AppleAuthLoginService {
  constructor(
    private readonly config: ConfigService,
    private readonly appleVerifier: AppleIdentityTokenVerifierService,
    private readonly socialAuthRateLimit: SocialAuthRateLimitService,
    private readonly socialAuthLogin: SocialAuthLoginService,
  ) {}

  isAppleAuthEnabled(): boolean {
    return this.config.get<boolean>('app.appleAuthEnabled') === true;
  }

  assertAppleAuthEnabled(): void {
    if (!this.isAppleAuthEnabled()) {
      throw new NotFoundException();
    }
  }

  async loginWithApple(identityToken: string, ip: string) {
    this.assertAppleAuthEnabled();
    this.socialAuthRateLimit.assertCanAttemptApple(ip);

    const claims = await this.appleVerifier.verifyIdentityToken(identityToken);

    return this.socialAuthLogin.completeSocialLogin({
      provider: AuthProvider.APPLE,
      claims: {
        providerUserId: claims.providerUserId,
        email: claims.email,
        emailVerified: claims.emailVerified,
      },
    });
  }
}
