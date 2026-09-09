import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';
import { APPLE_ISSUER, collectAppleClientIds } from './apple-client-ids.util';
import { normalizeAppleEmailVerified } from './apple-email.util';
import { AppleIdentityTokenVerifier, VerifiedAppleClaims } from './social-auth.types';

@Injectable()
export class AppleIdentityTokenVerifierService implements AppleIdentityTokenVerifier {
  private jwks: JWTVerifyGetKey;

  constructor(private readonly config: ConfigService) {
    this.jwks = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));
  }

  /** @internal Unit tests only — inject mocked JWKS resolver. */
  setJwksForTests(jwks: JWTVerifyGetKey): void {
    this.jwks = jwks;
  }

  async verifyIdentityToken(identityToken: string): Promise<VerifiedAppleClaims> {
    const audiences = collectAppleClientIds({
      ios: this.config.get<string>('app.appleClientIdIos'),
      web: this.config.get<string>('app.appleClientIdWeb'),
    });

    if (audiences.length === 0) {
      throw new UnauthorizedException('Authentication failed');
    }

    let payload;
    try {
      const result = await jwtVerify(identityToken, this.jwks, {
        issuer: APPLE_ISSUER,
        audience: audiences,
      });
      payload = result.payload;
    } catch {
      throw new UnauthorizedException('Authentication failed');
    }

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new UnauthorizedException('Authentication failed');
    }

    const email = typeof payload.email === 'string' ? payload.email : undefined;

    return {
      providerUserId: payload.sub,
      email,
      emailVerified: normalizeAppleEmailVerified(payload.email_verified),
    };
  }
}
