import { Prisma } from '@prisma/client';

/** Public paginated review list defaults (Stage 6.11D.1). */
export const PUBLIC_REVIEWS_DEFAULT_LIMIT = 20;
export const PUBLIC_REVIEWS_MAX_LIMIT = 50;

/** Review mutation rate limits (authenticated user id). */
export const REVIEW_MUTATION_USER_LIMIT = 30;
export const REVIEW_MUTATION_USER_WINDOW_MS = 15 * 60 * 1000;

/** Central public visibility predicate for Review queries. */
export function publicReviewWhere(): Pick<
  Prisma.ReviewWhereInput,
  'moderationHidden' | 'deletedAt'
> {
  return { moderationHidden: false, deletedAt: null };
}

/** Active user-owned reviews (excludes soft-deleted). */
export function activeUserReviewWhere(userId: string): Prisma.ReviewWhereInput {
  return { userId, deletedAt: null };
}
