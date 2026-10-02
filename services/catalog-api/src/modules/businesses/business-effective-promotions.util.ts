import { PromotionStatus } from '@prisma/client';
import { sliceToPublicLimit } from '../../common/utils/plan-entitlements.util';
import { PUBLIC_PROMOTIONS_PREVIEW_LIMIT } from '../../common/constants/public-preview.constants';
import { isCatalogEntityEligibleAtLocation, type BranchAssignmentRef } from './business-effective-catalog.util';

export type PromotionBranchRow = {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discountText: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: PromotionStatus;
  moderationHidden: boolean;
  createdAt: Date;
  branchAvailabilities: BranchAssignmentRef[];
};

export type EffectivePromotionsDto = {
  activeLocationId: string | null;
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    discountText: string | null;
    startDate: Date | null;
    endDate: Date | null;
  }>;
  totalCount: number;
};

export function filterPromotionsByBranchEligibility<
  T extends { branchAvailabilities: readonly BranchAssignmentRef[] },
>(promotions: readonly T[], activeLocationId: string | null): T[] {
  return promotions.filter((row) =>
    isCatalogEntityEligibleAtLocation(row.branchAvailabilities, activeLocationId),
  );
}

export function serializePublicPromotionItem(row: PromotionBranchRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    discountText: row.discountText,
    startDate: row.startDate,
    endDate: row.endDate,
  };
}

/** @deprecated Use serializePublicPromotionItem for guest-facing responses. */
export function serializeEffectivePromotionItem(row: PromotionBranchRow) {
  return serializePublicPromotionItem(row);
}

export function buildEffectivePromotionsDto(
  activeLocationId: string | null,
  publishedPromotions: PromotionBranchRow[],
): EffectivePromotionsDto {
  return {
    activeLocationId,
    items: sliceToPublicLimit(publishedPromotions, PUBLIC_PROMOTIONS_PREVIEW_LIMIT).map(
      serializeEffectivePromotionItem,
    ),
    totalCount: publishedPromotions.length,
  };
}
