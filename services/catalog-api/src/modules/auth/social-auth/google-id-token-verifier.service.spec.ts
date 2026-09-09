import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { GoogleIdTokenVerifierService } from './google-id-token-verifier.service';

describe('GoogleIdTokenVerifierService', () => {
  let config: { get: jest.Mock };
  let oauthClient: { verifyIdToken: jest.Mock };
  let service: GoogleIdTokenVerifierService;

  beforeEach(() => {
    config = {
      get: jest.fn((key: string) => {
        if (key === 'app.googleClientIdWeb') return 'web-client-id.apps.googleusercontent.com';
        return '';
      }),
    };
    oauthClient = { verifyIdToken: jest.fn() };
    service = new GoogleIdTokenVerifierService(config as unknown as ConfigService);
    service.setOAuthClientForTests(oauthClient as unknown as OAuth2Client);
  });

  it('returns normalized claims for a valid token', async () => {
    oauthClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-1',
        iss: 'https://accounts.google.com',
        email: 'user@gmail.com',
        email_verified: true,
        name: 'Google User',
      }),
    });

    await expect(service.verifyIdToken('valid-token')).resolves.toEqual({
      providerUserId: 'google-sub-1',
      email: 'user@gmail.com',
      emailVerified: true,
      name: 'Google User',
    });
    expect(oauthClient.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-token',
      audience: ['web-client-id.apps.googleusercontent.com'],
    });
  });

  it('rejects wrong issuer', async () => {
    oauthClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-1',
        iss: 'https://evil.example.com',
      }),
    });
    await expect(service.verifyIdToken('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects missing sub', async () => {
    oauthClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: 'accounts.google.com',
      }),
    });
    await expect(service.verifyIdToken('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when library verification fails', async () => {
    oauthClient.verifyIdToken.mockRejectedValue(new Error('invalid signature'));
    await expect(service.verifyIdToken('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when no client IDs configured', async () => {
    config.get.mockReturnValue('');
    await expect(service.verifyIdToken('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('collects multiple non-empty client IDs', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'app.googleClientIdAndroid') return 'android-id';
      if (key === 'app.googleClientIdIos') return 'ios-id';
      if (key === 'app.googleClientIdWeb') return 'web-id';
      return '';
    });
    oauthClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'sub',
        iss: 'accounts.google.com',
      }),
    });
    await service.verifyIdToken('token');
    expect(oauthClient.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'token',
      audience: ['android-id', 'ios-id', 'web-id'],
    });
  });
});
