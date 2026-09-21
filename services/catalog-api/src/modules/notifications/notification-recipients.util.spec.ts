import {
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessPermission,
} from '@prisma/client';
import { resolveReviewNotificationRecipientUserIds } from './notification-recipients.util';

describe('resolveReviewNotificationRecipientUserIds', () => {
  it('includes active owner and manager with REVIEWS_REPLY', async () => {
    const client = {
      businessMembership: {
        findMany: jest.fn().mockResolvedValue([
          { userId: 'owner-1', role: BusinessMembershipRole.OWNER },
          { userId: 'mgr-1', role: BusinessMembershipRole.MANAGER },
        ]),
      },
    };

    const ids = await resolveReviewNotificationRecipientUserIds(client as never, 'b1');
    expect(ids.sort()).toEqual(['mgr-1', 'owner-1']);
    expect(client.businessMembership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'b1',
          status: BusinessMembershipStatus.ACTIVE,
        }),
      }),
    );
  });

  it('deduplicates and excludes review author', async () => {
    const client = {
      businessMembership: {
        findMany: jest.fn().mockResolvedValue([
          { userId: 'owner-1', role: BusinessMembershipRole.OWNER },
        ]),
      },
    };
    const ids = await resolveReviewNotificationRecipientUserIds(client as never, 'b1', {
      excludeUserId: 'owner-1',
    });
    expect(ids).toEqual([]);
  });

  it('falls back to legacy ownerId when no owner membership row', async () => {
    const client = {
      businessMembership: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 'mgr-1',
            role: BusinessMembershipRole.MANAGER,
          },
        ]),
      },
    };
    const ids = await resolveReviewNotificationRecipientUserIds(client as never, 'b1', {
      legacyOwnerId: 'legacy-owner',
    });
    expect(ids.sort()).toEqual(['legacy-owner', 'mgr-1']);
  });

  it('does not add legacy owner when active owner membership exists', async () => {
    const client = {
      businessMembership: {
        findMany: jest.fn().mockResolvedValue([
          { userId: 'owner-1', role: BusinessMembershipRole.OWNER },
        ]),
      },
    };
    const ids = await resolveReviewNotificationRecipientUserIds(client as never, 'b1', {
      legacyOwnerId: 'legacy-owner',
    });
    expect(ids).toEqual(['owner-1']);
  });
});
