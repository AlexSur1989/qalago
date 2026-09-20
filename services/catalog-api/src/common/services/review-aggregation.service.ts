import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicReviewWhere } from '../constants/review.constants';

export type ReviewRatingMetrics = {
  averageRating: number | null;
  reviewCount: number;
};

export function emptyReviewRatingMetrics(): ReviewRatingMetrics {
  return { averageRating: null, reviewCount: 0 };
}

@Injectable()
export class ReviewAggregationService {
  constructor(private readonly prisma: PrismaService) {}

  async aggregateForBusiness(businessId: string): Promise<ReviewRatingMetrics> {
    const map = await this.aggregateForBusinessIds([businessId]);
    return map.get(businessId) ?? emptyReviewRatingMetrics();
  }

  async aggregateForBusinessIds(
    businessIds: string[],
  ): Promise<Map<string, ReviewRatingMetrics>> {
    const ratings = new Map<string, ReviewRatingMetrics>();
    if (!businessIds.length) {
      return ratings;
    }

    const rows = await this.prisma.review.groupBy({
      by: ['businessId'],
      where: {
        businessId: { in: businessIds },
        ...publicReviewWhere(),
      },
      _avg: { rating: true },
      _count: { _all: true },
    });

    for (const row of rows) {
      ratings.set(row.businessId, {
        averageRating: row._avg.rating,
        reviewCount: row._count._all,
      });
    }

    return ratings;
  }
}
