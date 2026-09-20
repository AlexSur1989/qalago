import { Prisma } from '@prisma/client';

/** Public paginated review list defaults (Stage 6.11D.1). */
export const PUBLIC_REVIEWS_DEFAULT_LIMIT = 20;
export const PUBLIC_REVIEWS_MAX_LIMIT = 50;

/** Central public visibility predicate for Review queries. */
export function publicReviewWhere(): Pick<Prisma.ReviewWhereInput, 'moderationHidden'> {
  return { moderationHidden: false };
}
