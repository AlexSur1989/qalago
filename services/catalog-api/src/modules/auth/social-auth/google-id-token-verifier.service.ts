import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { collectGoogleClientIds, isAllowedGoogleIssuer } from './google-client-ids.util';
import { GoogleIdTokenVerifier, VerifiedGoogleClaims } from './social-auth.types';

@Injectable()
export class GoogleIdTokenVerifierService implements GoogleIdTokenVerifier {
  constructor(
    private readonly config: ConfigService,
    private readonly oauthClient: OAuth2Client = new OAuth2Client(),
  ) {}

  async verifyIdToken(idToken: string): Promise<VerifiedGoogleClaims> {
    const audiences = collectGoogleClientIds({
      android: this.config.get<string>('app.googleClientIdAndroid'),
      ios: this.config.get<string>('app.googleClientIdIos'),
      web: this.config.get<string>('app.googleClientIdWeb'),
    });

    if (audiences.length === 0) {
      throw new UnauthorizedException('Authentication failed');
    }

    let payload;
    try {
      const ticket = await this.oauthClient.verifyIdToken({
        idToken,
        audience: audiences,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Authentication failed');
    }

    if (!payload?.sub || !isAllowedGoogleIssuer(payload.iss)) {
      throw new UnauthorizedException('Authentication failed');
    }

    return {
      providerUserId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
    };
  }
}
