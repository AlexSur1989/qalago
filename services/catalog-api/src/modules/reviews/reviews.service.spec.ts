import { ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createDefaultReviewServiceDeps } from '../../test-utils/mock-review-service-deps';

describe('ReviewsService', () => {
  const deps = createDefaultReviewServiceDeps();

  describe('reply', () => {
    it('returns generic permission error without enum leak', async () => {
      const businessAccess = deps.businessAccess as unknown as { resolveAccess: jest.Mock };
      businessAccess.resolveAccess.mockResolvedValue({
        permissions: [],
        accessRole: 'MANAGER',
      });
      const replyPrisma = {
        review: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            deletedAt: null,
            business: { id: 'b1', cityId: 'c1' },
          }),
          update: jest.fn(),
        },
      };
      const replyService = new ReviewsService(
        replyPrisma as unknown as PrismaService,
        deps.notifications as never,
        deps.businessAccess,
        deps.membership as never,
        deps.auditLog,
        deps.planLimits as never,
        deps.reviewRateLimit as never,
      );

      await expect(
        replyService.reply({ id: 'u1', phone: '+7700', role: 'BUSINESS' } as never, 'r1', {
          ownerReply: 'Thanks',
        }),
      ).rejects.toMatchObject({ message: 'Insufficient permissions', status: 403 });
    });
  });

  describe('findByUser', () => {
    it('returns active reviews for user with business info', async () => {
      const prisma = {
        review: { findMany: jest.fn() },
      };
      const service = new ReviewsService(
        prisma as unknown as PrismaService,
        deps.notifications as never,
        deps.businessAccess,
        deps.membership as never,
        deps.auditLog,
        deps.planLimits as never,
        deps.reviewRateLimit as never,
      );
      const rows = [{ id: 'r1', rating: 5, business: { id: 'b1', title: 'Cafe' } }];
      prisma.review.findMany.mockResolvedValue(rows);

      await expect(service.findByUser('user-1')).resolves.toEqual(rows);
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
        include: {
          business: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
