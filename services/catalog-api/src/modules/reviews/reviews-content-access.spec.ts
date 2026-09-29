import 'reflect-metadata';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  BusinessPermission,
  NotificationTargetType,
  NotificationType,
} from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createDefaultReviewServiceDeps } from '../../test-utils/mock-review-service-deps';

function buildService(
  prisma: Record<string, unknown>,
  deps = createDefaultReviewServiceDeps(),
) {
  return {
    service: new ReviewsService(
      prisma as unknown as PrismaService,
      deps.notifications as never,
      deps.businessAccess,
      deps.membership as never,
      deps.auditLog,
      deps.planLimits as never,
      deps.reviewRateLimit as never,
    ),
    deps,
  };
}

const manager = { id: 'mgr-1', sub: 'mgr-1', phone: '+7700', role: 'USER' as never };

describe('ReviewsService owner content access (BIZ.6)', () => {
  describe('findForManage', () => {
    it('requires REVIEWS_REPLY on requested business', async () => {
      const deps = createDefaultReviewServiceDeps();
      const assertBusinessPermission = jest.fn().mockResolvedValue({ id: 'b1' });
      deps.businessAccess = {
        assertBusinessPermission,
        resolveAccess: jest.fn(),
      } as never;
      const prisma = {
        review: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const { service } = buildService(prisma, deps);

      await service.findForManage(manager, 'b1');
      expect(assertBusinessPermission).toHaveBeenCalledWith(
        manager,
        'b1',
        BusinessPermission.REVIEWS_REPLY,
      );
    });

    it('includes moderation-hidden rows (not public filter)', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.businessAccess = {
        assertBusinessPermission: jest.fn().mockResolvedValue({ id: 'b1' }),
      } as never;
      const findMany = jest.fn().mockResolvedValue([{ id: 'r1', moderationHidden: true }]);
      const { service } = buildService({ review: { findMany } }, deps);

      const items = await service.findForManage(manager, 'b1');
      expect(items).toHaveLength(1);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { businessId: 'b1', deletedAt: null },
        }),
      );
    });
  });

  describe('reply', () => {
    function replyPrisma(review: Record<string, unknown>) {
      return {
        review: {
          findUnique: jest.fn().mockResolvedValue(review),
          update: jest.fn().mockImplementation(({ data }) => ({
            id: review.id,
            ...data,
          })),
        },
      };
    }

    it('owner path uses review.businessId for access (cross-business IDOR)', async () => {
      const deps = createDefaultReviewServiceDeps();
      const resolveAccess = jest.fn().mockResolvedValue({
        permissions: [BusinessPermission.REVIEWS_REPLY],
        accessRole: 'MANAGER',
      });
      deps.businessAccess = { resolveAccess } as never;
      deps.planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          limits: { canReplyToReviews: true },
        }),
      } as never;
      const { service } = buildService(
        replyPrisma({
          id: 'r1',
          userId: 'u2',
          deletedAt: null,
          business: { id: 'b-target', title: 'Cafe' },
        }),
        deps,
      );

      await service.reply(manager, 'r1', { ownerReply: 'Thanks' });
      expect(resolveAccess).toHaveBeenCalledWith(manager, 'b-target');
    });

    it('denies when resolveAccess fails (revoked / foreign business)', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.businessAccess = {
        resolveAccess: jest.fn().mockRejectedValue(new ForbiddenException('Not allowed')),
      } as never;
      const { service } = buildService(
        replyPrisma({
          id: 'r1',
          userId: 'u2',
          deletedAt: null,
          business: { id: 'b-other', title: 'X' },
        }),
        deps,
      );

      await expect(
        service.reply(manager, 'r1', { ownerReply: 'nope' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('denies FREE plan canReplyToReviews', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.businessAccess = {
        resolveAccess: jest.fn().mockResolvedValue({
          permissions: [BusinessPermission.REVIEWS_REPLY],
          accessRole: 'OWNER',
        }),
      } as never;
      deps.planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          limits: { canReplyToReviews: false },
        }),
      } as never;
      const { service } = buildService(
        replyPrisma({
          id: 'r1',
          userId: 'u2',
          deletedAt: null,
          business: { id: 'b1', title: 'Cafe' },
        }),
        deps,
      );

      await expect(
        service.reply(manager, 'r1', { ownerReply: 'Thanks' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows reply on moderation-hidden review', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.businessAccess = {
        resolveAccess: jest.fn().mockResolvedValue({
          permissions: [BusinessPermission.REVIEWS_REPLY],
          accessRole: 'OWNER',
        }),
      } as never;
      deps.planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          limits: { canReplyToReviews: true },
        }),
      } as never;
      const prisma = replyPrisma({
        id: 'r1',
        userId: 'u2',
        deletedAt: null,
        moderationHidden: true,
        business: { id: 'b1', title: 'Cafe' },
      });
      const { service } = buildService(prisma, deps);

      await expect(
        service.reply(manager, 'r1', { ownerReply: 'Noted' }),
      ).resolves.toMatchObject({ ownerReply: 'Noted' });
    });

    it('overwrites existing ownerReply (single reply field)', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.businessAccess = {
        resolveAccess: jest.fn().mockResolvedValue({
          permissions: [BusinessPermission.REVIEWS_REPLY],
          accessRole: 'OWNER',
        }),
      } as never;
      deps.planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          limits: { canReplyToReviews: true },
        }),
      } as never;
      const prisma = replyPrisma({
        id: 'r1',
        userId: 'u2',
        deletedAt: null,
        ownerReply: 'Old',
        business: { id: 'b1', title: 'Cafe' },
      });
      const { service } = buildService(prisma, deps);

      await service.reply(manager, 'r1', { ownerReply: 'New' });
      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { ownerReply: 'New' } }),
      );
    });

    it('deleted review → NotFound before access check side effects', async () => {
      const deps = createDefaultReviewServiceDeps();
      const resolveAccess = jest.fn();
      deps.businessAccess = { resolveAccess } as never;
      const { service } = buildService(
        replyPrisma({
          id: 'r1',
          userId: 'u2',
          deletedAt: new Date(),
          business: { id: 'b1', title: 'Cafe' },
        }),
        deps,
      );

      await expect(
        service.reply(manager, 'r1', { ownerReply: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(resolveAccess).not.toHaveBeenCalled();
    });

    it('emits REVIEW_REPLY notification with review and business context', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.businessAccess = {
        resolveAccess: jest.fn().mockResolvedValue({
          permissions: [BusinessPermission.REVIEWS_REPLY],
          accessRole: 'OWNER',
        }),
      } as never;
      deps.planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          limits: { canReplyToReviews: true },
        }),
      } as never;
      const { service, deps: d } = buildService(
        replyPrisma({
          id: 'r1',
          userId: 'consumer-1',
          deletedAt: null,
          business: { id: 'b1', title: 'Cafe Qala' },
        }),
        deps,
      );

      await service.reply(manager, 'r1', { ownerReply: 'Спасибо' });
      expect(d.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'consumer-1',
          type: NotificationType.REVIEW_REPLY,
          targetType: NotificationTargetType.REVIEW,
          targetId: 'r1',
          payload: expect.objectContaining({
            businessId: 'b1',
            reviewId: 'r1',
            businessName: 'Cafe Qala',
          }),
        }),
      );
    });
  });
});
