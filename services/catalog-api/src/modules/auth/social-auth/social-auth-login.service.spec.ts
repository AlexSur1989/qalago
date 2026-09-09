import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthIdentityService } from '../auth-identity.service';
import { SocialAuthLoginService } from './social-auth-login.service';

describe('SocialAuthLoginService', () => {
  let service: SocialAuthLoginService;
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
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      user: { create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('qalago-jwt') };
    authIdentity = {
      isTombstoned: jest.fn().mockResolvedValue(false),
      findIdentityWithUser: jest.fn().mockResolvedValue(null),
      createIdentity: jest.fn(),
      updateIdentityMetadata: jest.fn().mockResolvedValue(undefined),
    };

    service = new SocialAuthLoginService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      authIdentity as unknown as AuthIdentityService,
    );
  });

  it('creates USER with phone null and provider identity on first login', async () => {
    const createdUser = {
      id: 'u-new',
      phone: null,
      email: null,
      name: 'Google User',
      role: UserRole.USER,
    };
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = { user: { create: jest.fn().mockResolvedValue(createdUser) } };
      authIdentity.createIdentity.mockResolvedValue({ id: 'ai1' });
      return fn(tx);
    });

    const result = await service.completeSocialLogin({
      provider: AuthProvider.GOOGLE,
      claims: {
        providerUserId: 'google-sub-1',
        email: 'user@gmail.com',
        emailVerified: true,
      },
      initialName: 'Google User',
    });

    expect(result.accessToken).toBe('qalago-jwt');
    expect(result.user).toEqual(createdUser);
    expect(authIdentity.createIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-sub-1',
      }),
      expect.anything(),
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('creates Apple user without name', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'u-apple',
            phone: null,
            email: null,
            name: null,
            role: UserRole.USER,
          }),
        },
      };
      return fn(tx);
    });

    const result = await service.completeSocialLogin({
      provider: AuthProvider.APPLE,
      claims: {
        providerUserId: 'apple-sub-1',
        email: 'abc@privaterelay.appleid.com',
        emailVerified: true,
      },
    });

    expect(result.user.name).toBeNull();
    expect(result.user.phone).toBeNull();
  });

  it('repeat login updates metadata without overwriting user name', async () => {
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

    const result = await service.completeSocialLogin({
      provider: AuthProvider.GOOGLE,
      claims: {
        providerUserId: 'google-sub-1',
        email: 'user@gmail.com',
        emailVerified: true,
      },
    });

    expect(result.user.name).toBe('Existing Name');
    expect(authIdentity.updateIdentityMetadata).toHaveBeenCalledWith('ai1', {
      email: 'user@gmail.com',
      emailVerified: true,
    });
  });

  it('preserves provider email when later token omits email (Apple)', async () => {
    authIdentity.findIdentityWithUser.mockResolvedValue({
      id: 'ai-apple',
      user: {
        id: 'u1',
        phone: null,
        email: null,
        name: null,
        role: UserRole.USER,
        isActive: true,
      },
    });

    await service.completeSocialLogin({
      provider: AuthProvider.APPLE,
      claims: { providerUserId: 'apple-sub-1' },
    });

    expect(authIdentity.updateIdentityMetadata).toHaveBeenCalledWith('ai-apple', {});
  });

  it('blocks tombstoned identity', async () => {
    authIdentity.isTombstoned.mockResolvedValue(true);
    await expect(
      service.completeSocialLogin({
        provider: AuthProvider.APPLE,
        claims: { providerUserId: 'apple-sub-1' },
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
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

    await expect(
      service.completeSocialLogin({
        provider: AuthProvider.APPLE,
        claims: { providerUserId: 'apple-sub-1' },
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('retries lookup after unique conflict', async () => {
    prisma.$transaction.mockRejectedValue({ code: 'P2002' });
    authIdentity.findIdentityWithUser.mockResolvedValue({
      id: 'ai1',
      user: {
        id: 'u-raced',
        phone: null,
        email: null,
        name: null,
        role: UserRole.USER,
        isActive: true,
      },
    });

    const result = await service.completeSocialLogin({
      provider: AuthProvider.APPLE,
      claims: { providerUserId: 'apple-sub-1', email: 'a@privaterelay.appleid.com' },
    });

    expect(result.user.id).toBe('u-raced');
  });

  it('does not search users by email for auto-link', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'u-new',
            phone: null,
            email: null,
            name: null,
            role: UserRole.USER,
          }),
        },
      };
      return fn(tx);
    });

    await service.completeSocialLogin({
      provider: AuthProvider.APPLE,
      claims: {
        providerUserId: 'apple-sub-2',
        email: 'shared@gmail.com',
      },
    });

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });
});
