import { NotFoundException } from '@nestjs/common';
import { PushPlatform } from '@prisma/client';
import { PushDevicesService } from './push-devices.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PushDevicesService', () => {
  const userA = 'user-a';
  const userB = 'user-b';

  function build(prisma: Partial<PrismaService>) {
    return new PushDevicesService(prisma as PrismaService);
  }

  it('registers device for authenticated user', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'd1',
      platform: PushPlatform.ANDROID,
      isActive: true,
      lastSeenAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const findUnique = jest.fn().mockResolvedValue(null);
    const service = build({
      pushDevice: { findUnique, create, update: jest.fn() },
    } as unknown as PrismaService);

    const result = await service.register(userA, {
      token: 'fcm-token-1234567890123456',
      platform: PushPlatform.ANDROID,
      locale: 'ru',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: userA, isActive: true }),
      }),
    );
    expect(result.id).toBe('d1');
  });

  it('cannot register for arbitrary userId — userId comes from service caller only', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'd1',
      platform: PushPlatform.IOS,
      isActive: true,
      lastSeenAt: new Date(),
    });
    const service = build({
      pushDevice: {
        findUnique: jest.fn().mockResolvedValue(null),
        create,
      },
    } as unknown as PrismaService);

    await service.register(userB, {
      token: 'fcm-token-1234567890123456',
      platform: PushPlatform.IOS,
    });
    expect(create.mock.calls[0][0].data.userId).toBe(userB);
  });

  it('upserts token refresh for same user', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 'd1',
      platform: PushPlatform.ANDROID,
      isActive: true,
      lastSeenAt: new Date(),
    });
    const service = build({
      pushDevice: {
        findUnique: jest.fn().mockResolvedValue({ id: 'd1', userId: userA }),
        update,
      },
    } as unknown as PrismaService);

    await service.register(userA, {
      token: 'fcm-token-1234567890123456',
      platform: PushPlatform.ANDROID,
    });
    expect(update).toHaveBeenCalled();
  });

  it('reassigns token when another user logs in on same device', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 'd1',
      platform: PushPlatform.ANDROID,
      isActive: true,
      lastSeenAt: new Date(),
    });
    const service = build({
      pushDevice: {
        findUnique: jest.fn().mockResolvedValue({ id: 'd1', userId: userA }),
        update,
      },
    } as unknown as PrismaService);

    await service.register(userB, {
      token: 'fcm-token-1234567890123456',
      platform: PushPlatform.ANDROID,
    });
    expect(update.mock.calls[0][0].data.userId).toBe(userB);
    expect(update.mock.calls[0][0].data.isActive).toBe(true);
  });

  it('revokes own token', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = build({
      pushDevice: { updateMany },
    } as unknown as PrismaService);

    await expect(
      service.revoke(userA, 'fcm-token-1234567890123456'),
    ).resolves.toEqual({ success: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { token: 'fcm-token-1234567890123456', userId: userA, isActive: true },
      data: { isActive: false },
    });
  });

  it('cannot revoke another user registration', async () => {
    const service = build({
      pushDevice: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    } as unknown as PrismaService);

    await expect(service.revoke(userB, 'fcm-token-1234567890123456')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deduplicates active tokens for fan-out', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: '1', token: 'same', locale: null, platform: PushPlatform.ANDROID },
      { id: '2', token: 'same', locale: null, platform: PushPlatform.ANDROID },
      { id: '3', token: 'other', locale: 'kk', platform: PushPlatform.IOS },
    ]);
    const service = build({
      pushDevice: { findMany },
    } as unknown as PrismaService);

    const tokens = await service.listActiveTokensForUser(userA);
    expect(tokens).toHaveLength(2);
  });
});
