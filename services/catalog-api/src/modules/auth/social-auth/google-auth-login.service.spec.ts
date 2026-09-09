import { HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SocialAuthRateLimitService } from '../../../common/services/social-auth-rate-limit.service';
import { AuthIdentityService } from '../auth-identity.service';
import { GoogleIdTokenVerifierService } from './google-id-token-verifier.service';
import { GoogleAuthLoginService } from './google-auth-login.service';

const claims = {
  providerUserId: 'google-sub-1',
  email: 'user@gmail.com',
  emailVerified: true,
  name: 'Google User',
};

describe('GoogleAuthLoginService', () => {
  let service: GoogleAuthLoginService;
  let prisma: {
    $transaction: jest.Mock;
    user: { create: jest.Mock; findUnique: jest.Mock; findFirst: jest.Mock };
  };
  let jwt: { signAsync: jest.Mock };
  let authIdentity: {
    isTombstoned: jest.Mock;
    findIdentityWithUser: jest.Mock;
    createIdentity: jest.Mock;
    updateIdentityMetadata: jest.Mock;
    tombstoneUserIdentities: jest.Mock;
  };
  let googleVerifier: { verifyIdToken: jest.Mock };
  let socialAuthRateLimit: { assertCanAttemptGoogle: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('qalago-jwt') };
    authIdentity = {
      isTombstoned: jest.fn().mockResolvedValue(false),
      findIdentityWithUser: jest.fn().mockResolvedValue(null),
      createIdentity: jest.fn(),
      updateIdentityMetadata: jest.fn().mockResolvedValue(undefined),
      tombstoneUserIdentities: jest.fn(),
    };
    googleVerifier = {
      verifyIdToken: jest.fn().mockResolvedValue(claims),
    };
    socialAuthRateLimit = {
      assertCanAttemptGoogle: jest.fn(),
    };
    config = {
      get: jest.fn((key: string) => (key === 'app.googleAuthEnabled' ? true : undefined)),
    };

    service = new GoogleAuthLoginService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      authIdentity as unknown as AuthIdentityService,
      googleVerifier as unknown as GoogleIdTokenVerifierService,
      socialAuthRateLimit as unknown as SocialAuthRateLimitService,
      config as unknown as ConfigService,
    );
  });

  describe('feature flag', () => {
    it('returns 404 when GOOGLE_AUTH_ENABLED=false', async () => {
      config.get.mockReturnValue(false);
      await expect(service.loginWithGoogle('token', '127.0.0.1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('first login', () => {
    it('creates USER with phone null and AuthIdentity GOOGLE', async () => {
      const createdUser = {
        id: 'u-new',
        phone: null,
        email: null,
        name: 'Google User',
        role: UserRole.USER,
      };
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(createdUser) },
        };
        authIdentity.createIdentity.mockResolvedValue({ id: 'ai1' });
        return fn(tx);
      });

      const result = await service.loginWithGoogle('id-token', '127.0.0.1');

      expect(result.accessToken).toBe('qalago-jwt');
      expect(result.user).toEqual(createdUser);
      expect(authIdentity.createIdentity).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: AuthProvider.GOOGLE,
          providerUserId: 'google-sub-1',
          email: 'user@gmail.com',
          emailVerified: true,
        }),
        expect.anything(),
      );
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'u-new',
        role: UserRole.USER,
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('repeat login', () => {
    it('returns same user and updates provider metadata without overwriting name', async () => {
      authIdentity.findIdentityWithUser.mockResolvedValue({
        id: 'ai1',
        user: {
          id: 'u1',
          phone: null,
          email: null,
          name: 'Existing Name',
          role: UserRole.USER,
          isActive: true,
        },
      });

      const result = await service.loginWithGoogle('id-token', '127.0.0.1');

      expect(result.user.id).toBe('u1');
      expect(result.user.name).toBe('Existing Name');
      expect(authIdentity.updateIdentityMetadata).toHaveBeenCalledWith('ai1', {
        email: 'user@gmail.com',
        emailVerified: true,
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('security', () => {
    it('blocks tombstoned identity', async () => {
      authIdentity.isTombstoned.mockResolvedValue(true);
      await expect(service.loginWithGoogle('token', '127.0.0.1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('blocks inactive user', async () => {
      authIdentity.findIdentityWithUser.mockResolvedValue({
        id: 'ai1',
        user: {
          id: 'u1',
          phone: null,
          email: null,
          name: null,
          role: UserRole.USER,
          isActive: false,
        },
      });
      await expect(service.loginWithGoogle('token', '127.0.0.1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('does not auto-link by existing User.email', async () => {
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'u-google',
              phone: null,
              email: null,
              name: 'Google User',
              role: UserRole.USER,
            }),
          },
        };
        return fn(tx);
      });

      await service.loginWithGoogle('token', '127.0.0.1');

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('always creates USER role for new Google accounts', async () => {
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            create: jest.fn().mockImplementation(({ data }) =>
              Promise.resolve({
                id: 'u1',
                phone: data.phone,
                email: data.email ?? null,
                name: data.name,
                role: data.role,
              }),
            ),
          },
        };
        return fn(tx);
      });

      const result = await service.loginWithGoogle('token', '127.0.0.1');
      expect(result.user.role).toBe(UserRole.USER);
    });

    it('propagates verifier failure as generic auth failure', async () => {
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

  describe('race handling', () => {
    it('retries lookup after unique conflict on first login', async () => {
      prisma.$transaction.mockRejectedValue({ code: 'P2002' });
      authIdentity.findIdentityWithUser.mockResolvedValue({
        id: 'ai1',
        user: {
          id: 'u-raced',
          phone: null,
          email: null,
          name: 'Raced',
          role: UserRole.USER,
          isActive: true,
        },
      });

      const result = await service.loginWithGoogle('token', '127.0.0.1');
      expect(result.user.id).toBe('u-raced');
    });
  });

  describe('account deletion regression', () => {
    it('blocks re-login after tombstone and does not create a new user', async () => {
      authIdentity.isTombstoned.mockResolvedValue(true);

      await expect(service.loginWithGoogle('token', '127.0.0.1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(authIdentity.createIdentity).not.toHaveBeenCalled();
    });
  });
});
