import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { AppleIdentityTokenVerifierService } from './apple-identity-token-verifier.service';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest.fn(),
}));

describe('AppleIdentityTokenVerifierService', () => {
  let config: { get: jest.Mock };
  let service: AppleIdentityTokenVerifierService;
  const jwtVerifyMock = jwtVerify as jest.Mock;

  beforeEach(() => {
    jwtVerifyMock.mockReset();
    config = {
      get: jest.fn((key: string) => {
        if (key === 'app.appleClientIdIos') return 'kz.qalago.qalagoMobile';
        return '';
      }),
    };
    service = new AppleIdentityTokenVerifierService(config as unknown as ConfigService);
    service.setJwksForTests('mock-jwks' as never);
  });

  it('returns normalized claims for valid token', async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: 'apple-sub-1',
        email: 'user@example.com',
        email_verified: 'true',
      },
    });

    await expect(service.verifyIdentityToken('valid-token')).resolves.toEqual({
      providerUserId: 'apple-sub-1',
      email: 'user@example.com',
      emailVerified: true,
    });

    expect(jwtVerifyMock).toHaveBeenCalledWith('valid-token', 'mock-jwks', {
      issuer: 'https://appleid.apple.com',
      audience: ['kz.qalago.qalagoMobile'],
    });
  });

  it('accepts private relay email', async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: 'apple-sub-2',
        email: 'abc@privaterelay.appleid.com',
        email_verified: true,
      },
    });

    await expect(service.verifyIdentityToken('token')).resolves.toEqual({
      providerUserId: 'apple-sub-2',
      email: 'abc@privaterelay.appleid.com',
      emailVerified: true,
    });
  });

  it('allows token without email claim', async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: { sub: 'apple-sub-3' },
    });

    await expect(service.verifyIdentityToken('token')).resolves.toEqual({
      providerUserId: 'apple-sub-3',
      email: undefined,
      emailVerified: undefined,
    });
  });

  it('rejects missing sub', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { email: 'a@b.com' } });
    await expect(service.verifyIdentityToken('token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects jwt verification failure', async () => {
    jwtVerifyMock.mockRejectedValue(new Error('invalid signature'));
    await expect(service.verifyIdentityToken('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when no Apple client IDs configured', async () => {
    config.get.mockReturnValue('');
    await expect(service.verifyIdentityToken('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('collects multiple audiences', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'app.appleClientIdIos') return 'ios-id';
      if (key === 'app.appleClientIdWeb') return 'web-service-id';
      return '';
    });
    jwtVerifyMock.mockResolvedValue({ payload: { sub: 'sub' } });
    await service.verifyIdentityToken('token');
    expect(jwtVerifyMock).toHaveBeenCalledWith(
      'token',
      'mock-jwks',
      expect.objectContaining({ audience: ['ios-id', 'web-service-id'] }),
    );
  });
});
