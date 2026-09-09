import { ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: {
    review: { findMany: jest.Mock };
  };
  const planLimits = {
    getBusinessPlanContext: jest.fn().mockResolvedValue({
      limits: { canReplyToReviews: true },
      catalog: { nameRu: 'Бизнес' },
    }),
  };

  beforeEach(() => {
    prisma = {
      review: { findMany: jest.fn() },
    };
    service = new ReviewsService(
      prisma as unknown as PrismaService,
      { create: jest.fn() } as never,
      asBusinessAccessService(createMockBusinessAccess()),
      asAuditLogService(createMockAuditLog()),
      planLimits as never,
    );
  });

  describe('reply', () => {
    it('returns generic permission error without enum leak', async () => {
      const businessAccess = createMockBusinessAccess();
      businessAccess.resolveAccess.mockResolvedValue({
        permissions: [],
        accessRole: 'MANAGER',
      });
      const replyPrisma = {
        review: {
          findMany: jest.fn(),
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            business: { id: 'b1', cityId: 'c1' },
          }),
          update: jest.fn(),
        },
      };
      const replyService = new ReviewsService(
        replyPrisma as unknown as PrismaService,
        { create: jest.fn() } as never,
        asBusinessAccessService(businessAccess),
        asAuditLogService(createMockAuditLog()),
        planLimits as never,
      );

      await expect(
        replyService.reply({ id: 'u1', phone: '+7700', role: 'BUSINESS' } as never, 'r1', {
          ownerReply: 'Thanks',
        }),
      ).rejects.toMatchObject({ message: 'Insufficient permissions', status: 403 });
    });
  });

  describe('findByUser', () => {
    it('returns reviews for user with business info', async () => {
      const rows = [{ id: 'r1', rating: 5, business: { id: 'b1', title: 'Cafe' } }];
      prisma.review.findMany.mockResolvedValue(rows);

      await expect(service.findByUser('user-1')).resolves.toEqual(rows);
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          business: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
