import { ConflictException } from '@nestjs/common';
import { MonetizationProductType, Prisma, PromotionStatus } from '@prisma/client';
import { BusinessLocationDeleteBlockedCode } from '../../../common/utils/branch-availability-management.util';
import { isCatalogEntityEligibleAtLocation } from '../../businesses/business-effective-catalog.util';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
} from '../errors/monetization.errors';

export type CampaignLocationContextInput = {
  businessId: string;
  cityId: string;
  productType: MonetizationProductType;
  promotionId?: string | null;
  targetBusinessLocationId?: string | null;
  destinationBusinessLocationId?: string | null;
  /** When false, never auto-fill destination from single PBA branch (delete safety). */
  allowAutoDestination?: boolean;
};

export type ResolvedCampaignLocationContext = {
  targetBusinessLocationId: string | null;
  destinationBusinessLocationId: string | null;
};

function normalizeLocationId(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function loadScopedBusinessLocation(
  tx: Prisma.TransactionClient,
  businessId: string,
  locationId: string,
) {
  const location = await tx.businessLocation.findFirst({
    where: { id: locationId, businessId },
    select: { id: true, businessId: true, cityId: true },
  });
  if (!location) {
    monetizationBadRequest(
      MonetizationErrorCode.INVALID_CAMPAIGN_BRANCH,
      'Branch does not belong to this business',
    );
  }
  return location!;
}

export async function isPromotionEffectiveAtLocation(
  tx: Prisma.TransactionClient,
  promotionId: string,
  businessId: string,
  locationId: string,
): Promise<boolean> {
  const promotion = await tx.promotion.findFirst({
    where: {
      id: promotionId,
      businessId,
      status: PromotionStatus.ACTIVE,
      moderationHidden: false,
    },
    select: {
      branchAvailabilities: { select: { locationId: true } },
    },
  });
  if (!promotion) {
    return false;
  }
  return isCatalogEntityEligibleAtLocation(
    promotion.branchAvailabilities,
    locationId,
  );
}

async function eligiblePromotionBranchIdsInCity(
  tx: Prisma.TransactionClient,
  promotionId: string,
  businessId: string,
  cityId: string,
): Promise<string[]> {
  const promotion = await tx.promotion.findFirst({
    where: { id: promotionId, businessId },
    select: {
      branchAvailabilities: { select: { locationId: true } },
    },
  });
  if (!promotion) {
    monetizationBadRequest(
      MonetizationErrorCode.PROMOTION_NOT_OWNED,
      'Promotion not found or not owned by business',
    );
  }
  const assignments = promotion!.branchAvailabilities ?? [];
  if (assignments.length === 0) {
    const branches = await tx.businessLocation.findMany({
      where: { businessId, cityId },
      select: { id: true },
    });
    return branches.map((b) => b.id);
  }
  const ids = assignments.map((a) => a.locationId);
  const inCity = await tx.businessLocation.findMany({
    where: { businessId, cityId, id: { in: ids } },
    select: { id: true },
  });
  return inCity.map((b) => b.id);
}

export async function validateAndResolveCampaignLocationContext(
  tx: Prisma.TransactionClient,
  input: CampaignLocationContextInput,
): Promise<ResolvedCampaignLocationContext> {
  let targetBusinessLocationId = normalizeLocationId(input.targetBusinessLocationId);
  let destinationBusinessLocationId = normalizeLocationId(
    input.destinationBusinessLocationId,
  );

  if (targetBusinessLocationId) {
    const loc = await loadScopedBusinessLocation(
      tx,
      input.businessId,
      targetBusinessLocationId,
    );
    if (loc.cityId !== input.cityId) {
      monetizationBadRequest(
        MonetizationErrorCode.CAMPAIGN_BRANCH_CITY_MISMATCH,
        'Target branch city does not match campaign city',
      );
    }
  }

  if (destinationBusinessLocationId) {
    const loc = await loadScopedBusinessLocation(
      tx,
      input.businessId,
      destinationBusinessLocationId,
    );
    if (loc.cityId !== input.cityId) {
      monetizationBadRequest(
        MonetizationErrorCode.CAMPAIGN_BRANCH_CITY_MISMATCH,
        'Destination branch city does not match campaign city',
      );
    }
  }

  if (
    targetBusinessLocationId &&
    destinationBusinessLocationId &&
    targetBusinessLocationId !== destinationBusinessLocationId
  ) {
    monetizationBadRequest(
      MonetizationErrorCode.CAMPAIGN_TARGET_DESTINATION_MISMATCH,
      'Campaign target and destination must reference the same branch when both are set',
    );
  }

  const promotionId = input.promotionId ?? null;
  if (promotionId) {
    const owned = await tx.promotion.findFirst({
      where: { id: promotionId, businessId: input.businessId },
      select: { id: true },
    });
    if (!owned) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_OWNED,
        'Promotion not found or not owned by business',
      );
    }
  }

  if (
    promotionId &&
    destinationBusinessLocationId &&
    !(await isPromotionEffectiveAtLocation(
      tx,
      promotionId,
      input.businessId,
      destinationBusinessLocationId,
    ))
  ) {
    monetizationBadRequest(
      MonetizationErrorCode.PROMOTION_NOT_EFFECTIVE_AT_BRANCH,
      'Promotion is not effective at the selected destination branch',
    );
  }

  if (
    input.productType === MonetizationProductType.PROMOTED_PROMOTION &&
    promotionId &&
    !destinationBusinessLocationId
  ) {
    const eligible = await eligiblePromotionBranchIdsInCity(
      tx,
      promotionId,
      input.businessId,
      input.cityId,
    );
    if (eligible.length === 0) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_EFFECTIVE_AT_BRANCH,
        'Promotion has no eligible branches in the campaign city',
      );
    }
    if (eligible.length === 1 && input.allowAutoDestination !== false) {
      destinationBusinessLocationId = eligible[0]!;
    } else if (eligible.length > 1) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_DESTINATION_BRANCH_REQUIRED,
        'Explicit destination branch is required for this promotion in the campaign city',
      );
    }
  }

  return { targetBusinessLocationId, destinationBusinessLocationId };
}

export function parseCampaignLocationFieldsFromMeta(
  metadata: Prisma.JsonValue | null | undefined,
): {
  targetBusinessLocationId?: string;
  destinationBusinessLocationId?: string;
} {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  const meta = metadata as Record<string, unknown>;
  const target =
    typeof meta.targetBusinessLocationId === 'string'
      ? meta.targetBusinessLocationId
      : undefined;
  const destination =
    typeof meta.destinationBusinessLocationId === 'string'
      ? meta.destinationBusinessLocationId
      : undefined;
  return { targetBusinessLocationId: target, destinationBusinessLocationId: destination };
}

/**
 * Clears AdCampaign target/destination pointers to a branch before delete.
 * Validates post-clear campaign configuration remains safe.
 */
export async function clearAdCampaignBranchReferencesBeforeDelete(
  tx: Prisma.TransactionClient,
  businessId: string,
  locationId: string,
): Promise<void> {
  const campaigns = await tx.adCampaign.findMany({
    where: {
      businessId,
      OR: [
        { targetBusinessLocationId: locationId },
        { destinationBusinessLocationId: locationId },
      ],
    },
    include: { product: { select: { type: true } } },
  });

  if (campaigns.length === 0) {
    return;
  }

  for (const campaign of campaigns) {
    const nextTarget =
      campaign.targetBusinessLocationId === locationId
        ? null
        : campaign.targetBusinessLocationId;
    const nextDestination =
      campaign.destinationBusinessLocationId === locationId
        ? null
        : campaign.destinationBusinessLocationId;

    if (
      campaign.promotionId &&
      !nextDestination &&
      campaign.product.type === MonetizationProductType.PROMOTED_PROMOTION
    ) {
      const selectedBranchCount = await tx.promotionBranchAvailability.count({
        where: { promotionId: campaign.promotionId, businessId: campaign.businessId },
      });
      if (selectedBranchCount > 1) {
        throw new ConflictException({
          code: BusinessLocationDeleteBlockedCode,
          message:
            'This branch is referenced by an ad campaign. Update or end the campaign branch targeting before deleting the branch.',
        });
      }
    }

    try {
      await validateAndResolveCampaignLocationContext(tx, {
        businessId: campaign.businessId,
        cityId: campaign.cityId,
        productType: campaign.product.type,
        promotionId: campaign.promotionId,
        targetBusinessLocationId: nextTarget,
        destinationBusinessLocationId: nextDestination,
        allowAutoDestination: false,
      });
    } catch {
      throw new ConflictException({
        code: BusinessLocationDeleteBlockedCode,
        message:
          'This branch is referenced by an ad campaign. Update or end the campaign branch targeting before deleting the branch.',
      });
    }

    await tx.adCampaign.update({
      where: { id: campaign.id },
      data: {
        targetBusinessLocationId: nextTarget,
        destinationBusinessLocationId: nextDestination,
      },
    });
  }
}
