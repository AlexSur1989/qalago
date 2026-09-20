import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { publicReviewWhere } from '../../common/constants/review.constants';
import { ReviewAggregationService } from '../../common/services/review-aggregation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { ReviewErrorCode } from './review-errors';
import { ReviewsService } from './reviews.service';

function buildReviewsService(prisma: Record<string, unknown>) {
  const planLimits = {
    getBusinessPlanContext: jest.fn().mockResolvedValue({
      limits: { canReplyToReviews: true },
    }),
  };
  return new ReviewsService(
    prisma as unknown as PrismaService,
    { create: jest.fn() } as never,
    asBusinessAccessService(createMockBusinessAccess()),
    asAuditLogService(createMockAuditLog()),
    planLimits as never,
  );
}

describe('ReviewsService integrity (Stage 6.11D.1)', () => {
  describe('create', () => {
    it('first review succeeds', async () => {
      const prisma = {
        business: { findUnique: jest.fn().mockResolvedValue({ id: 'b1', title: 'Cafe', ownerId: null }) },
        review: {
          create: jest.fn().mockResolvedValue({ id: 'r1', rating: 5 }),
        },
      };
      const service = buildReviewsService(prisma);
      await expect(
        service.create({ id: 'u1' } as never, { businessId: 'b1', rating: 5, text: 'ok' }),
      ).resolves.toMatchObject({ id: 'r1' });
    });

    it('duplicate maps to REVIEW_ALREADY_EXISTS', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      });
      const prisma = {
        business: { findUnique: jest.fn().mockResolvedValue({ id: 'b1', title: 'Cafe', ownerId: null }) },
        review: { create: jest.fn().mockRejectedValue(err) },
      };
      const service = buildReviewsService(prisma);
      await expect(
        service.create({ id: 'u1' } as never, { businessId: 'b1', rating: 4 }),
      ).rejects.toMatchObject({
        response: {
          code: ReviewErrorCode.REVIEW_ALREADY_EXISTS,
        },
      });
      await expect(
        service.create({ id: 'u1' } as never, { businessId: 'b1', rating: 4 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findByBusiness pagination', () => {
    it('returns bounded page with total metadata newest-first', async () => {
      const prisma = {
        review: {
          findMany: jest.fn().mockResolvedValue([{ id: 'r2' }, { id: 'r1' }]),
          count: jest.fn().mockResolvedValue(5),
        },
      };
      const service = buildReviewsService(prisma);
      const result = await service.findByBusiness({ businessId: 'b1', page: 1, limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.pagination).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { businessId: 'b1', ...publicReviewWhere() },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: 0,
          take: 2,
        }),
      );
    });
  });
});

describe('ReviewAggregationService', () => {
  it('excludes hidden reviews from aggregates', async () => {
    const prisma = {
      review: {
        groupBy: jest.fn().mockResolvedValue([
          { businessId: 'b1', _avg: { rating: 4 }, _count: { _all: 2 } },
        ]),
      },
    };
    const service = new ReviewAggregationService(prisma as unknown as PrismaService);
    const map = await service.aggregateForBusinessIds(['b1', 'b2']);
    expect(map.get('b1')).toEqual({ averageRating: 4, reviewCount: 2 });
    expect(map.has('b2')).toBe(false);
    expect(prisma.review.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining(publicReviewWhere()),
      }),
    );
  });

  it('returns null average and zero count when no public reviews', async () => {
    const prisma = { review: { groupBy: jest.fn().mockResolvedValue([]) } };
    const service = new ReviewAggregationService(prisma as unknown as PrismaService);
    const metrics = await service.aggregateForBusiness('b-empty');
    expect(metrics).toEqual({ averageRating: null, reviewCount: 0 });
  });
});
