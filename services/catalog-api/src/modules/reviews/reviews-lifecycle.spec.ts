import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  NotificationTargetType,
  NotificationType,
} from '@prisma/client';
import { publicReviewWhere } from '../../common/constants/review.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { createDefaultReviewServiceDeps } from '../../test-utils/mock-review-service-deps';
import { ReviewErrorCode } from './review-errors';
import { ReviewsService } from './reviews.service';

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

const user = { id: 'user-1', sub: 'user-1', phone: '+7700', role: 'USER' as never };

describe('ReviewsService lifecycle (Stage 6.11D.2)', () => {
  describe('self-review', () => {
    it('blocks active owner membership', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.membership.hasActiveOwnerAccess.mockResolvedValue(true);
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({ id: 'b1', title: 'Cafe', ownerId: 'other', cityId: 'c1' }),
        },
      };
      const { service } = buildService(prisma, deps);
      await expect(
        service.create(user, { businessId: 'b1', rating: 5 }),
      ).rejects.toMatchObject({
        response: { code: ReviewErrorCode.REVIEW_SELF_REVIEW_FORBIDDEN },
      });
    });

    it('blocks active manager membership', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.membership.getActiveMembership.mockResolvedValue({
        role: BusinessMembershipRole.MANAGER,
        status: BusinessMembershipStatus.ACTIVE,
      });
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({ id: 'b1', title: 'Cafe', ownerId: null, cityId: 'c1' }),
        },
      };
      const { service } = buildService(prisma, deps);
      await expect(service.create(user, { businessId: 'b1', rating: 5 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('restore', () => {
    it('reuses soft-deleted row and preserves moderationHidden', async () => {
      const deps = createDefaultReviewServiceDeps();
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({ id: 'b1', title: 'Cafe', ownerId: null, cityId: 'c1' }),
        },
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r-old',
            userId: 'user-1',
            businessId: 'b1',
            deletedAt: new Date('2026-01-01'),
            moderationHidden: true,
          }),
          update: jest.fn().mockResolvedValue({
            id: 'r-old',
            rating: 3,
            moderationHidden: true,
            deletedAt: null,
          }),
        },
      };
      const { service, deps: d } = buildService(prisma, deps);
      const result = await service.create(user, { businessId: 'b1', rating: 3, text: ' restored ' });
      expect(result.id).toBe('r-old');
      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r-old' },
          data: expect.objectContaining({ deletedAt: null, rating: 3 }),
        }),
      );
      expect(d.auditMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REVIEW_RESTORE }),
      );
      expect(d.notifications.create).not.toHaveBeenCalled();
    });

    it('notifies owner on visible restore with review target', async () => {
      const deps = createDefaultReviewServiceDeps();
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'b1',
            title: 'Cafe',
            ownerId: 'owner-1',
            cityId: 'c1',
          }),
        },
        businessMembership: {
          findMany: jest.fn().mockResolvedValue([
            { userId: 'owner-1', role: BusinessMembershipRole.OWNER },
          ]),
        },
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r-old',
            userId: 'user-1',
            businessId: 'b1',
            deletedAt: new Date('2026-01-01'),
            moderationHidden: false,
          }),
          update: jest.fn().mockResolvedValue({
            id: 'r-old',
            rating: 4,
            moderationHidden: false,
            deletedAt: null,
          }),
        },
      };
      const { service, deps: d } = buildService(prisma, deps);
      await service.create(user, { businessId: 'b1', rating: 4 });
      expect(d.notifications.createForUsers).toHaveBeenCalledWith(
        ['owner-1'],
        expect.objectContaining({
          type: NotificationType.NEW_REVIEW,
          targetType: NotificationTargetType.REVIEW,
          targetId: 'r-old',
        }),
      );
    });

    it('active duplicate remains 409', async () => {
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({ id: 'b1', title: 'Cafe', ownerId: null, cityId: 'c1' }),
        },
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            deletedAt: null,
          }),
        },
      };
      const { service } = buildService(prisma);
      await expect(service.create(user, { businessId: 'b1', rating: 5 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('owner can edit active review', async () => {
      const prisma = {
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            userId: 'user-1',
            businessId: 'b1',
            deletedAt: null,
            moderationHidden: false,
            rating: 4,
          }),
          update: jest.fn().mockResolvedValue({ id: 'r1', rating: 5 }),
        },
      };
      const { service, deps } = buildService(prisma);
      await service.update(user, 'r1', { rating: 5, text: 'updated' });
      expect(deps.auditMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REVIEW_UPDATE }),
      );
    });

    it('denies foreign user with not found', async () => {
      const prisma = {
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            userId: 'other',
            deletedAt: null,
          }),
        },
      };
      const { service } = buildService(prisma);
      await expect(service.update(user, 'r1', { rating: 5 })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects editing deleted review', async () => {
      const prisma = {
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            userId: 'user-1',
            deletedAt: new Date(),
          }),
        },
      };
      const { service } = buildService(prisma);
      await expect(service.update(user, 'r1', { rating: 5 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('does not clear moderationHidden on edit', async () => {
      const prisma = {
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            userId: 'user-1',
            businessId: 'b1',
            deletedAt: null,
            moderationHidden: true,
            rating: 2,
          }),
          update: jest.fn().mockImplementation(({ data }) => ({
            id: 'r1',
            ...data,
            moderationHidden: true,
          })),
        },
      };
      const { service } = buildService(prisma);
      await service.update(user, 'r1', { rating: 3, text: 'x' });
      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ moderationHidden: false }),
        }),
      );
    });
  });

  describe('soft delete', () => {
    it('sets deletedAt for owner', async () => {
      const prisma = {
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            userId: 'user-1',
            businessId: 'b1',
            deletedAt: null,
            rating: 5,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      const { service, deps } = buildService(prisma);
      const result = await service.softDelete(user, 'r1');
      expect(result.success).toBe(true);
      expect(prisma.review.update).toHaveBeenCalled();
      expect(deps.auditMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REVIEW_DELETE }),
      );
    });

    it('is idempotent when already deleted', async () => {
      const deletedAt = new Date('2026-08-01');
      const prisma = {
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            userId: 'user-1',
            businessId: 'b1',
            deletedAt,
            rating: 5,
          }),
        },
      };
      const { service, deps } = buildService(prisma);
      const result = await service.softDelete(user, 'r1');
      expect(result.deletedAt).toBe(deletedAt);
      expect(deps.auditMock.record).not.toHaveBeenCalled();
    });
  });

  describe('reply', () => {
    it('rejects reply to soft-deleted review', async () => {
      const deps = createDefaultReviewServiceDeps();
      const access = deps.businessAccess as unknown as { resolveAccess: jest.Mock };
      access.resolveAccess.mockResolvedValue({
        permissions: ['REVIEWS_REPLY'],
        accessRole: 'OWNER',
      });
      const prisma = {
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            userId: 'u2',
            deletedAt: new Date(),
            business: { id: 'b1', cityId: 'c1' },
          }),
        },
      };
      const { service } = buildService(prisma, deps);
      await expect(
        service.reply({ id: 'owner', role: 'BUSINESS' } as never, 'r1', { ownerReply: 'hi' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('rate limit', () => {
    it('maps excessive mutations to 429', async () => {
      const deps = createDefaultReviewServiceDeps();
      deps.reviewRateLimit.assertCanMutateReview.mockImplementation(() => {
        throw new HttpException(
          { message: 'Too many review updates', statusCode: HttpStatus.TOO_MANY_REQUESTS },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      });
      const { service } = buildService({}, deps);
      await expect(service.create(user, { businessId: 'b1', rating: 5 })).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });
  });

  describe('public list filter', () => {
    it('includes deletedAt null in public predicate', () => {
      expect(publicReviewWhere()).toEqual({ moderationHidden: false, deletedAt: null });
    });
  });
});
