import { NotFoundException } from '@nestjs/common';
import {
  NotificationTargetType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsService', () => {
  const userA = 'user-a';
  const userB = 'user-b';

  const pushDelivery = {
    deliverAfterCommit: jest.fn(),
    deliverAfterCommitMany: jest.fn(),
  };

  function buildService(prisma: Partial<PrismaService>) {
    return new NotificationsService(prisma as PrismaService, pushDelivery as never);
  }

  it('lists paginated notifications for current user only with deterministic order', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'n2',
        userId: userA,
        type: NotificationType.NEW_REVIEW,
        title: 't',
        body: null,
        isRead: false,
        targetType: null,
        targetId: null,
        payload: null,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
    const count = jest.fn().mockResolvedValue(1);
    const service = buildService({
      notification: { findMany, count },
    } as unknown as PrismaService);

    const result = await service.findPage(userA, { page: 1, limit: 20 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: userA },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 20,
      }),
    );
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(result.items[0].type).toBe(NotificationType.NEW_REVIEW);
  });

  it('defaults page limit to 20 and caps at 50', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const service = buildService({
      notification: { findMany, count },
    } as unknown as PrismaService);

    await service.findPage(userA, {});
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20 }));

    await service.findPage(userA, { limit: 100 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });

  it('returns unread count scoped to user', async () => {
    const count = jest.fn().mockResolvedValue(3);
    const service = buildService({
      notification: { count },
    } as unknown as PrismaService);

    await expect(service.unreadCount(userA)).resolves.toEqual({ count: 3 });
    expect(count).toHaveBeenCalledWith({ where: { userId: userA, isRead: false } });
  });

  it('marks own notification read with stable response', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = buildService({
      notification: { updateMany },
    } as unknown as PrismaService);

    await expect(service.markRead(userA, 'n1')).resolves.toEqual({
      success: true,
      id: 'n1',
      isRead: true,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'n1', userId: userA },
      data: { isRead: true },
    });
  });

  it('rejects marking another user notification', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const service = buildService({
      notification: { updateMany },
    } as unknown as PrismaService);

    await expect(service.markRead(userB, 'n1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('mark all read scoped to authenticated user', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 4 });
    const service = buildService({
      notification: { updateMany },
    } as unknown as PrismaService);

    await expect(service.markAllRead(userA)).resolves.toEqual({ success: true, updated: 4 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: userA, isRead: false },
      data: { isRead: true },
    });
  });

  it('serializes target fields and null legacy rows', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'legacy',
        userId: userA,
        type: NotificationType.GENERAL,
        title: 'Legacy',
        body: 'body',
        isRead: true,
        targetType: null,
        targetId: null,
        payload: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'structured',
        userId: userA,
        type: NotificationType.NEW_REVIEW,
        title: 'Review',
        body: null,
        isRead: false,
        targetType: NotificationTargetType.REVIEW,
        targetId: 'rev-1',
        payload: { businessId: 'b1', reviewId: 'rev-1' },
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
    const count = jest.fn().mockResolvedValue(2);
    const service = buildService({
      notification: { findMany, count },
    } as unknown as PrismaService);

    const result = await service.findPage(userA, { page: 1, limit: 20 });
    expect(result.items[0].targetType).toBeNull();
    expect(result.items[1].targetType).toBe(NotificationTargetType.REVIEW);
    expect(result.items[1].payload).toEqual({ businessId: 'b1', reviewId: 'rev-1' });
  });

  it('create uses transaction client when provided', async () => {
    const txCreate = jest.fn().mockResolvedValue({ id: 'n1' });
    const tx = {
      notification: { create: txCreate },
    } as unknown as Prisma.TransactionClient;
    const rootCreate = jest.fn();
    const service = buildService({
      notification: { create: rootCreate },
    } as unknown as PrismaService);

    await service.create({
      userId: userA,
      type: NotificationType.GENERAL,
      title: 'In tx',
      tx,
    });

    expect(txCreate).toHaveBeenCalled();
    expect(rootCreate).not.toHaveBeenCalled();
    expect(pushDelivery.deliverAfterCommit).not.toHaveBeenCalled();
  });

  it('schedules push after create outside transaction', async () => {
    const created = { id: 'n-push', userId: userA, type: NotificationType.GENERAL, title: 't' };
    const create = jest.fn().mockResolvedValue(created);
    const service = buildService({
      notification: { create },
    } as unknown as PrismaService);

    await service.create({
      userId: userA,
      type: NotificationType.GENERAL,
      title: 'Hello',
    });
    expect(pushDelivery.deliverAfterCommit).toHaveBeenCalledWith(created);
  });

  it('does not schedule push when created inside transaction', async () => {
    pushDelivery.deliverAfterCommit.mockClear();
    const txCreate = jest.fn().mockResolvedValue({ id: 'n-tx' });
    const tx = {
      notification: { create: txCreate },
    } as unknown as Prisma.TransactionClient;
    const service = buildService({
      notification: { create: jest.fn() },
    } as unknown as PrismaService);

    await service.create({
      userId: userA,
      type: NotificationType.GENERAL,
      title: 'Tx',
      tx,
    });
    expect(pushDelivery.deliverAfterCommit).not.toHaveBeenCalled();
  });
});
