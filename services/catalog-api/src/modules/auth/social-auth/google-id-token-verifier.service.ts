import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { collectGoogleClientIds, isAllowedGoogleIssuer } from './google-client-ids.util';
import { GoogleIdTokenVerifier, VerifiedGoogleClaims } from './social-auth.types';

@Injectable()
export class GoogleIdTokenVerifierService implements GoogleIdTokenVerifier {
  private oauthClient: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.oauthClient = new OAuth2Client();
  }

  /** @internal Unit tests only — inject a mocked OAuth client. */
  setOAuthClientForTests(client: OAuth2Client): void {
    this.oauthClient = client;
  }

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
