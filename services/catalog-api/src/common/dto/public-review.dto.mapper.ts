/**
 * KZ-C.3 — public review DTO (no internal userId / moderation fields).
 */

export type PublicReviewAuthorDto = {
  name: string | null;
  avatarUrl: string | null;
};

export type PublicReviewDto = {
  id: string;
  businessId: string;
  rating: number;
  text: string | null;
  createdAt: Date;
  ownerReply: string | null;
  ownerReplyAt?: Date | null;
  author: PublicReviewAuthorDto;
};

type ReviewRow = {
  id: string;
  businessId: string;
  userId?: string;
  rating: number;
  text: string | null;
  createdAt: Date;
  ownerReply: string | null;
  ownerReplyAt?: Date | null;
  deletedAt?: Date | null;
  moderationHidden?: boolean;
  user?: { id?: string; name: string | null; avatarUrl?: string | null } | null;
};

export function toPublicReviewDto(review: ReviewRow): PublicReviewDto {
  return {
    id: review.id,
    businessId: review.businessId,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt,
    ownerReply: review.ownerReply,
    ownerReplyAt: review.ownerReplyAt,
    author: {
      name: review.user?.name ?? null,
      avatarUrl: review.user?.avatarUrl ?? null,
    },
  };
}

export function mapPublicReviews(items: readonly ReviewRow[]): PublicReviewDto[] {
  return items.map(toPublicReviewDto);
}

export function mapPublicReviewsPreviewBlock<T extends { items: ReviewRow[]; totalCount: number }>(
  block: T,
): { items: PublicReviewDto[]; totalCount: number } {
  return {
    items: mapPublicReviews(block.items),
    totalCount: block.totalCount,
  };
}
