import {
  ContentReportTargetType,
  ModerationActionType,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { ModerationService } from './moderation.service';

describe('ModerationService review notification producers', () => {
  const actor = { id: 'admin-1', role: UserRole.ADMIN } as never;

  it('notifies review author on hide transition', async () => {
    const notifications = { create: jest.fn() };
    const txReview = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'rev-1',
        userId: 'author-1',
        businessId: 'b1',
        moderationHidden: false,
        deletedAt: null,
        business: { title: 'Cafe' },
      }),
      update: jest.fn(),
    };
    const tx = {
      moderationAction: { create: jest.fn() },
      moderationCase: { update: jest.fn() },
      review: txReview,
      business: { update: jest.fn() },
    };
    const prisma = {
      moderationCase: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'case-1',
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          cityId: 'city-1',
          targetSnapshot: {},
        }),
      },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };

    const service = new ModerationService(
      prisma as never,
      { assertBusinessInAdminScope: jest.fn() } as never,
      { record: jest.fn() } as never,
      { revokeAllUserSessions: jest.fn() } as never,
      {} as never,
      notifications as never,
    );

    await service.applyAction(actor, 'case-1', {
      actionType: ModerationActionType.REVIEW_HIDE,
      internalNote: 'policy violation note',
    });

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'author-1',
        type: NotificationType.REVIEW_HIDDEN,
        tx,
      }),
    );
  });

  it('does not notify when review already hidden', async () => {
    const notifications = { create: jest.fn() };
    const txReview = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'rev-1',
        userId: 'author-1',
        businessId: 'b1',
        moderationHidden: true,
        deletedAt: null,
        business: { title: 'Cafe' },
      }),
      update: jest.fn(),
    };
    const tx = {
      moderationAction: { create: jest.fn() },
      moderationCase: { update: jest.fn() },
      review: txReview,
    };
    const prisma = {
      moderationCase: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'case-1',
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          cityId: 'city-1',
          targetSnapshot: {},
        }),
      },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };

    const service = new ModerationService(
      prisma as never,
      { assertBusinessInAdminScope: jest.fn() } as never,
      { record: jest.fn() } as never,
      { revokeAllUserSessions: jest.fn() } as never,
      {} as never,
      notifications as never,
    );

    await service.applyAction(actor, 'case-1', {
      actionType: ModerationActionType.REVIEW_HIDE,
      internalNote: 'policy violation note',
    });

    expect(notifications.create).not.toHaveBeenCalled();
  });
});
