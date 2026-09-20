import { Injectable } from '@nestjs/common';
import {
  REVIEW_MUTATION_USER_LIMIT,
  REVIEW_MUTATION_USER_WINDOW_MS,
} from '../../common/constants/review.constants';
import { SlidingWindowRateLimitService } from '../../common/services/sliding-window-rate-limit.service';

@Injectable()
export class ReviewRateLimitService {
  constructor(private readonly limiter: SlidingWindowRateLimitService) {}

  assertCanMutateReview(userId: string): void {
    this.limiter.assertAllowed(
      `review-mutation:user:${userId}`,
      REVIEW_MUTATION_USER_LIMIT,
      REVIEW_MUTATION_USER_WINDOW_MS,
      'Too many review updates',
    );
  }
}
