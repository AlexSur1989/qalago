import {
  MonetizationProductType,
  Prisma,
  PrismaClient,
  PromotionStatus,
} from '@prisma/client';
import { resolveCityContextLocationIds } from '../../businesses/business-discovery-city-context.util';
import {
  buildEffectivePhysicalDto,
  type BusinessPhysicalFallback,
} from '../../businesses/business-effective-physical.util';
import { isCatalogEntityEligibleAtLocation } from '../../businesses/business-effective-catalog.util';
import { pickSelectedPromotionContextLocation } from '../../promotions/promotion-discovery-city.util';

export type AdServeLocationCampaignInput = {
  id: string;
  businessId: string;
  cityId: string;
  targetBusinessLocationId: string | null;
  destinationBusinessLocationId: string | null;
  promotionId: string | null;
  productType: MonetizationProductType;
  /** Fallback when campaign.promotionId is null (legacy rows). */
  orderItemPromotionId?: string | null;
};

export type AdServeLocationContext = {
  excluded: false;
  destinationLocationId: string | null;
  contextLocationId: string | null;
  /** Branch used for business-card physical fields; null → legacy Business fields. */
  cardLocation: Prisma.BusinessLocationGetPayload<{
    select: typeof adServeLocationSelect;
  }> | null;
};

export type AdServeLocationExcluded = { excluded: true };

export type AdServeLocationResult = AdServeLocationContext | AdServeLocationExcluded;

export const adServeLocationSelect = {
  id: true,
  businessId: true,
  cityId: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  website: true,
  workHours: true,
  isPrimary: true,
  createdAt: true,
} satisfies Prisma.BusinessLocationSelect;

type LocationRow = Prisma.BusinessLocationGetPayload<{
  select: typeof adServeLocationSelect;
}>;

type PromotionServeRow = {
  id: string;
  businessId: string;
  status: PromotionStatus;
  moderationHidden: boolean;
  branchAvailabilities: { locationId: string }[];
};

function promotionIdForCampaign(campaign: AdServeLocationCampaignInput): string | null {
  return campaign.promotionId ?? campaign.orderItemPromotionId ?? null;
}

function isLocationValidForServe(
  loc: LocationRow | undefined,
  businessId: string,
  serveCityId: string,
  campaignCityId: string,
): loc is LocationRow {
  if (!loc) return false;
  if (loc.businessId !== businessId) return false;
  if (loc.cityId !== serveCityId) return false;
  if (loc.cityId !== campaignCityId) return false;
  return true;
}

/**
 * Canonical runtime destination for an ad tap (A.8.3).
 * Precedence: explicit destination → target → promotion branch in city → city context branch.
 */
export function resolveAdDestinationLocationId(params: {
  campaign: AdServeLocationCampaignInput;
  serveCityId: string;
  locationById: ReadonlyMap<string, LocationRow>;
  cityContextByBusinessId: ReadonlyMap<string, string>;
  promotion: PromotionServeRow | null;
}): string | null {
  const { campaign, serveCityId, locationById, cityContextByBusinessId, promotion } =
    params;

  if (campaign.destinationBusinessLocationId) {
    const loc = locationById.get(campaign.destinationBusinessLocationId);
    if (!isLocationValidForServe(loc, campaign.businessId, serveCityId, campaign.cityId)) {
      return null;
    }
    return loc.id;
  }

  if (campaign.targetBusinessLocationId) {
    const loc = locationById.get(campaign.targetBusinessLocationId);
    if (!isLocationValidForServe(loc, campaign.businessId, serveCityId, campaign.cityId)) {
      return null;
    }
    return loc.id;
  }

  const promotionId = promotionIdForCampaign(campaign);
  if (
    campaign.productType === MonetizationProductType.PROMOTED_PROMOTION &&
    promotionId &&
    promotion
  ) {
    const assignments = promotion.branchAvailabilities ?? [];
    if (assignments.length === 0) {
      return cityContextByBusinessId.get(campaign.businessId) ?? null;
    }
    const assignedRows: LocationRow[] = [];
    for (const a of assignments) {
      const loc = locationById.get(a.locationId);
      if (loc && loc.businessId === campaign.businessId && loc.cityId === serveCityId) {
        assignedRows.push(loc);
      }
    }
    return pickSelectedPromotionContextLocation(assignedRows);
  }

  return cityContextByBusinessId.get(campaign.businessId) ?? null;
}

function passesTargetBranchEligibility(
  campaign: AdServeLocationCampaignInput,
  serveCityId: string,
  locationById: ReadonlyMap<string, LocationRow>,
): boolean {
  if (!campaign.targetBusinessLocationId) {
    return true;
  }
  const loc = locationById.get(campaign.targetBusinessLocationId);
  return isLocationValidForServe(
    loc,
    campaign.businessId,
    serveCityId,
    campaign.cityId,
  );
}

function assertPromotionDestinationEffective(
  promotionId: string,
  businessId: string,
  destinationId: string,
  promotion: PromotionServeRow | null,
): boolean {
  if (!isPromotionRuntimeEligible(promotion, businessId) || promotion!.id !== promotionId) {
    return false;
  }
  return isPromotionEffectiveAtLocationSync(promotion!, destinationId);
}

/**
 * Batch branch eligibility + destination resolution for ad serving (fail-closed per campaign).
 */
export async function batchResolveAdServeLocationContexts(
  prisma: Pick<PrismaClient, 'businessLocation' | 'promotion'>,
  serveCityId: string,
  campaigns: readonly AdServeLocationCampaignInput[],
): Promise<Map<string, AdServeLocationResult>> {
  const results = new Map<string, AdServeLocationResult>();
  if (campaigns.length === 0) {
    return results;
  }

  const locationIds = new Set<string>();
  for (const c of campaigns) {
    if (c.targetBusinessLocationId) locationIds.add(c.targetBusinessLocationId);
    if (c.destinationBusinessLocationId) {
      locationIds.add(c.destinationBusinessLocationId);
    }
  }

  const promotionIds = [
    ...new Set(
      campaigns
        .filter((c) => c.productType === MonetizationProductType.PROMOTED_PROMOTION)
        .map((c) => promotionIdForCampaign(c))
        .filter((id): id is string => !!id),
    ),
  ];

  const [locationRows, promotionRows] = await Promise.all([
    locationIds.size > 0
      ? prisma.businessLocation.findMany({
          where: { id: { in: [...locationIds] } },
          select: adServeLocationSelect,
        })
      : Promise.resolve([]),
    promotionIds.length > 0
      ? prisma.promotion.findMany({
          where: { id: { in: promotionIds } },
          select: {
            id: true,
            businessId: true,
            status: true,
            moderationHidden: true,
            branchAvailabilities: { select: { locationId: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const locationById = new Map(locationRows.map((row) => [row.id, row]));
  for (const p of promotionRows) {
    for (const a of p.branchAvailabilities) {
      if (!locationById.has(a.locationId)) {
        locationIds.add(a.locationId);
      }
    }
  }

  if (locationIds.size > locationRows.length) {
    const extra = await prisma.businessLocation.findMany({
      where: { id: { in: [...locationIds] } },
      select: adServeLocationSelect,
    });
    for (const row of extra) {
      locationById.set(row.id, row);
    }
  }

  const needsCityContext = campaigns.filter(
    (c) =>
      !c.destinationBusinessLocationId &&
      (!c.targetBusinessLocationId ||
        c.productType === MonetizationProductType.PROMOTED_PROMOTION),
  );
  const businessIdsForContext = [
    ...new Set(
      campaigns
        .filter(
          (c) =>
            !c.targetBusinessLocationId &&
            !c.destinationBusinessLocationId &&
            c.productType !== MonetizationProductType.PROMOTED_PROMOTION,
        )
        .map((c) => c.businessId),
    ),
    ...new Set(
      needsCityContext
        .filter((c) => c.productType === MonetizationProductType.PROMOTED_PROMOTION)
        .map((c) => c.businessId),
    ),
  ];

  const cityContextByBusinessId = await resolveCityContextLocationIds(
    prisma,
    serveCityId,
    businessIdsForContext,
  );

  const missingContextIds = [...cityContextByBusinessId.values()].filter(
    (id) => !locationById.has(id),
  );
  if (missingContextIds.length > 0) {
    const contextRows = await prisma.businessLocation.findMany({
      where: { id: { in: missingContextIds } },
      select: adServeLocationSelect,
    });
    for (const row of contextRows) {
      locationById.set(row.id, row);
    }
  }

  const promotionById = new Map(promotionRows.map((p) => [p.id, p]));

  for (const campaign of campaigns) {
    if (serveCityId !== campaign.cityId) {
      results.set(campaign.id, { excluded: true });
      continue;
    }

    if (!passesTargetBranchEligibility(campaign, serveCityId, locationById)) {
      results.set(campaign.id, { excluded: true });
      continue;
    }

    const promotionId = promotionIdForCampaign(campaign);
    const promotion = promotionId ? promotionById.get(promotionId) ?? null : null;

    if (campaign.productType === MonetizationProductType.PROMOTED_PROMOTION) {
      if (!promotionId || !promotion || promotion.businessId !== campaign.businessId) {
        results.set(campaign.id, { excluded: true });
        continue;
      }
      if (promotion.status !== PromotionStatus.ACTIVE || promotion.moderationHidden) {
        results.set(campaign.id, { excluded: true });
        continue;
      }
    }

    const destinationLocationId = resolveAdDestinationLocationId({
      campaign,
      serveCityId,
      locationById,
      cityContextByBusinessId,
      promotion,
    });

    if (
      campaign.productType === MonetizationProductType.PROMOTED_PROMOTION &&
      promotionId
    ) {
      if (!destinationLocationId) {
        results.set(campaign.id, { excluded: true });
        continue;
      }
      const effective = assertPromotionDestinationEffective(
        promotionId,
        campaign.businessId,
        destinationLocationId,
        promotion,
      );
      if (!effective) {
        results.set(campaign.id, { excluded: true });
        continue;
      }
    }

    if (campaign.destinationBusinessLocationId && !destinationLocationId) {
      results.set(campaign.id, { excluded: true });
      continue;
    }

    const cardLocation = destinationLocationId
      ? locationById.get(destinationLocationId) ?? null
      : null;

    results.set(campaign.id, {
      excluded: false,
      destinationLocationId,
      contextLocationId: destinationLocationId,
      cardLocation,
    });
  }

  return results;
}

export function overlayBusinessCardWithLocation<
  T extends BusinessPhysicalFallback & {
    id: string;
    title: string;
    slug: string;
    shortDesc?: string | null;
    coverImageUrl?: string | null;
    categoryId?: string | null;
    category?: unknown;
  },
>(business: T, cardLocation: LocationRow | null): T {
  if (!cardLocation) {
    return business;
  }
  const physical = buildEffectivePhysicalDto(
    business,
    cardLocation as Parameters<typeof buildEffectivePhysicalDto>[1],
  );
  return {
    ...business,
    address: physical.address,
    latitude: physical.latitude as T['latitude'],
    longitude: physical.longitude as T['longitude'],
    phone: physical.phone,
    whatsapp: physical.whatsapp,
    instagram: physical.instagram,
    website: physical.website,
  };
}

export function isPromotionRuntimeEligible(
  promotion: PromotionServeRow | null,
  businessId: string,
): boolean {
  if (!promotion || promotion.businessId !== businessId) return false;
  if (promotion.status !== PromotionStatus.ACTIVE || promotion.moderationHidden) {
    return false;
  }
  return true;
}

export function isPromotionEffectiveAtLocationSync(
  promotion: PromotionServeRow,
  locationId: string,
): boolean {
  return isCatalogEntityEligibleAtLocation(promotion.branchAvailabilities, locationId);
}
