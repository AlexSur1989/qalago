import { AuthProvider } from '@prisma/client';
import { AuthIdentityService } from './auth-identity.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthIdentityService', () => {
  let service: AuthIdentityService;
  let prisma: {
    authIdentity: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    authIdentityTombstone: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      authIdentity: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      authIdentityTombstone: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new AuthIdentityService(prisma as unknown as PrismaService);
  });

  it('findByProviderIdentity uses provider+providerUserId composite key', async () => {
    prisma.authIdentity.findUnique.mockResolvedValue({ id: 'ai1' });
    await service.findByProviderIdentity(AuthProvider.GOOGLE, 'google-sub-1');
    expect(prisma.authIdentity.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerUserId: {
          provider: AuthProvider.GOOGLE,
          providerUserId: 'google-sub-1',
        },
      },
    });
  });

  it('isTombstoned returns true when tombstone exists', async () => {
    prisma.authIdentityTombstone.findUnique.mockResolvedValue({ id: 't1' });
    await expect(service.isTombstoned(AuthProvider.APPLE, 'apple-sub')).resolves.toBe(true);
  });

  it('isTombstoned returns false when no tombstone', async () => {
    prisma.authIdentityTombstone.findUnique.mockResolvedValue(null);
    await expect(service.isTombstoned(AuthProvider.GOOGLE, 'missing')).resolves.toBe(false);
  });

  it('createIdentity stores provider metadata without requiring email', async () => {
    prisma.authIdentity.create.mockResolvedValue({ id: 'ai1' });
    await service.createIdentity({
      userId: 'u1',
      provider: AuthProvider.GOOGLE,
      providerUserId: 'sub-1',
    });
    expect(prisma.authIdentity.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        provider: AuthProvider.GOOGLE,
        providerUserId: 'sub-1',
        email: null,
        emailVerified: null,
      },
    });
  });

  it('allows same email on different provider identities', async () => {
    prisma.authIdentity.create
      .mockResolvedValueOnce({ id: 'g1' })
      .mockResolvedValueOnce({ id: 'a1' });

    await service.createIdentity({
      userId: 'u1',
      provider: AuthProvider.GOOGLE,
      providerUserId: 'g-sub',
      email: 'user@example.com',
      emailVerified: true,
    });
    await service.createIdentity({
      userId: 'u2',
      provider: AuthProvider.APPLE,
      providerUserId: 'a-sub',
      email: 'user@example.com',
      emailVerified: true,
    });

    expect(prisma.authIdentity.create).toHaveBeenCalledTimes(2);
  });

  it('tombstoneUserIdentities upserts tombstones and deletes identities', async () => {
    prisma.authIdentity.findMany.mockResolvedValue([
      { provider: AuthProvider.GOOGLE, providerUserId: 'g-sub' },
      { provider: AuthProvider.APPLE, providerUserId: 'a-sub' },
    ]);
    prisma.authIdentityTombstone.upsert.mockResolvedValue({});
    prisma.authIdentity.deleteMany.mockResolvedValue({ count: 2 });

    const count = await service.tombstoneUserIdentities('u1');

    expect(count).toBe(2);
    expect(prisma.authIdentityTombstone.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.authIdentityTombstone.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          provider: AuthProvider.GOOGLE,
          providerUserId: 'g-sub',
        }),
      }),
    );
    expect(prisma.authIdentity.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('tombstone upsert is idempotent for repeat deletion', async () => {
    prisma.authIdentity.findMany.mockResolvedValue([
      { provider: AuthProvider.GOOGLE, providerUserId: 'g-sub' },
    ]);
    prisma.authIdentityTombstone.upsert.mockResolvedValue({});
    prisma.authIdentity.deleteMany.mockResolvedValue({ count: 1 });

    await service.tombstoneUserIdentities('u1');
    await service.tombstoneUserIdentities('u1');

    expect(prisma.authIdentityTombstone.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
  });
});
