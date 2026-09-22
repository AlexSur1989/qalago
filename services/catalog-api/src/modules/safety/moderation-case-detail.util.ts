import { ContentReportTargetType } from '@prisma/client';
export type ModerationReviewTargetState =
  | 'MISSING'
  | 'ACTIVE'
  | 'MODERATION_HIDDEN'
  | 'USER_SOFT_DELETED';

export type ModerationReviewTargetDto = {
  available: boolean;
  state: ModerationReviewTargetState;
  id?: string;
  rating?: number;
  text?: string | null;
  ownerReply?: string | null;
  moderationHidden?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  publiclyVisible?: boolean;
  contentMayHaveChangedSinceReport: boolean;
  business?: {
    id: string;
    title: string;
    city?: { id: string; slug: string; nameRu: string } | null;
  };
  reviewer?: { id: string; name: string | null; phone: string | null };
};

type ReviewRow = {
  id: string;
  rating: number;
  text: string | null;
  ownerReply: string | null;
  moderationHidden: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string | null; phone: string | null };
  business: {
    id: string;
    title: string;
    city: { id: string; slug: string; nameRu: string } | null;
  };
};

export function resolveModerationReviewTarget(
  review: ReviewRow | null,
): ModerationReviewTargetDto {
  if (!review) {
    return {
      available: false,
      state: 'MISSING',
      contentMayHaveChangedSinceReport: false,
    };
  }

  let state: ModerationReviewTargetState = 'ACTIVE';
  if (review.deletedAt) {
    state = 'USER_SOFT_DELETED';
  } else if (review.moderationHidden) {
    state = 'MODERATION_HIDDEN';
  }

  const publiclyVisible =
    !review.moderationHidden && review.deletedAt == null;

  return {
    available: true,
    state,
    id: review.id,
    rating: review.rating,
    text: review.text,
    ownerReply: review.ownerReply,
    moderationHidden: review.moderationHidden,
    deletedAt: review.deletedAt,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    publiclyVisible,
    contentMayHaveChangedSinceReport: true,
    business: {
      id: review.business.id,
      title: review.business.title,
      city: review.business.city,
    },
    reviewer: {
      id: review.user.id,
      name: review.user.name,
      phone: review.user.phone,
    },
  };
}

export function isReviewTargetCase(
  targetType: ContentReportTargetType,
): boolean {
  return targetType === ContentReportTargetType.REVIEW;
}

export type ModerationMediaTargetState = 'MISSING' | 'ACTIVE' | 'MODERATION_HIDDEN';

export type ModerationMediaBranchDto = {
  id: string;
  address: string;
  isPrimary: boolean;
  city?: {
    id: string;
    slug: string;
    nameRu: string;
    nameKk: string | null;
  } | null;
};

export type ModerationMediaTargetDto = {
  available: boolean;
  state: ModerationMediaTargetState;
  id?: string;
  imageUrl?: string;
  locationId?: string | null;
  moderationHidden?: boolean;
  /** True when locationId is set but branch row is missing or not owned by this business. */
  branchUnavailable?: boolean;
  business?: {
    id: string;
    title: string;
    city?: { id: string; slug: string; nameRu: string } | null;
  };
  branch?: ModerationMediaBranchDto | null;
};

type MediaImageRow = {
  id: string;
  imageUrl: string;
  locationId: string | null;
  moderationHidden: boolean;
  business: {
    id: string;
    title: string;
    city: { id: string; slug: string; nameRu: string } | null;
  };
  branchLocation: {
    id: string;
    address: string;
    isPrimary: boolean;
    city: {
      id: string;
      slug: string;
      nameRu: string;
      nameKk: string | null;
    };
  } | null;
};

export function isMediaTargetCase(
  targetType: ContentReportTargetType,
): boolean {
  return targetType === ContentReportTargetType.MEDIA;
}

export function resolveModerationMediaTarget(
  image: MediaImageRow | null,
): ModerationMediaTargetDto {
  if (!image) {
    return { available: false, state: 'MISSING' };
  }

  const state: ModerationMediaTargetState = image.moderationHidden
    ? 'MODERATION_HIDDEN'
    : 'ACTIVE';

  const branchUnavailable =
    image.locationId != null && image.branchLocation == null;

  return {
    available: true,
    state,
    id: image.id,
    imageUrl: image.imageUrl,
    locationId: image.locationId,
    moderationHidden: image.moderationHidden,
    branchUnavailable: branchUnavailable || undefined,
    business: {
      id: image.business.id,
      title: image.business.title,
      city: image.business.city,
    },
    branch: image.branchLocation
      ? {
          id: image.branchLocation.id,
          address: image.branchLocation.address,
          isPrimary: image.branchLocation.isPrimary,
          city: image.branchLocation.city,
        }
      : null,
  };
}
