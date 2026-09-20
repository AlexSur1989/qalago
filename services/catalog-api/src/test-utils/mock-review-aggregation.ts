import { publicReviewWhere } from '../common/constants/review.constants';
import { ReviewAggregationService } from '../common/services/review-aggregation.service';

export function createMockReviewAggregation() {
  return {
    aggregateForBusiness: jest.fn().mockResolvedValue({
      averageRating: null,
      reviewCount: 0,
    }),
    aggregateForBusinessIds: jest.fn().mockResolvedValue(new Map()),
  };
}

/** Delegates to prisma.review.groupBy for catalog sort tests. */
export function createReviewAggregationFromPrisma(prisma: {
  review: { groupBy: jest.Mock };
}) {
  const mock = createMockReviewAggregation();
  mock.aggregateForBusinessIds.mockImplementation(async (businessIds: string[]) => {
    const rows = await prisma.review.groupBy({
      by: ['businessId'],
      where: { businessId: { in: businessIds }, ...publicReviewWhere() },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const map = new Map<string, { averageRating: number | null; reviewCount: number }>();
    for (const row of rows) {
      map.set(row.businessId, {
        averageRating: row._avg.rating,
        reviewCount: row._count._all,
      });
    }
    return map;
  });
  mock.aggregateForBusiness.mockImplementation(async (businessId: string) => {
    const map = await mock.aggregateForBusinessIds([businessId]);
    return map.get(businessId) ?? { averageRating: null, reviewCount: 0 };
  });
  return mock;
}

export function asReviewAggregationService(
  mock: ReturnType<typeof createMockReviewAggregation>,
): ReviewAggregationService {
  return mock as unknown as ReviewAggregationService;
}
