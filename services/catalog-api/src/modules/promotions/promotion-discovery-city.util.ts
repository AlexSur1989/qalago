import { Prisma, PrismaClient } from '@prisma/client';
import { resolveCityContextLocationIds } from '../businesses/business-discovery-city-context.util';

export function mergePromotionWhereWithAnd(
  where: Prisma.PromotionWhereInput,
  clause: Prisma.PromotionWhereInput,
): void {
  if (where.AND) {
    const existing = Array.isArray(where.AND) ? where.AND : [where.AND];
    where.AND = [...existing, clause];
    return;
  }
  where.AND = [clause];
}

/** Promotion-grain city feed eligibility (A.7.9.4): ALL = branch in C; SELECTED = assigned branch in C. */
export function promotionCityFeedEligibilityWhere(cityId: string): Prisma.PromotionWhereInput {
  return {
    OR: [
      {
        AND: [
          { branchAvailabilities: { none: {} } },
          { business: { locations: { some: { cityId } } } },
        ],
      },
      {
        branchAvailabilities: {
          some: { branchLocation: { cityId } },
        },
      },
    ],
  };
}

type BranchContextRow = {
  id: string;
  cityId: string;
  isPrimary: boolean;
  createdAt: Date;
};

/** SELECTED promotion: assigned branch in city; primary wins if assigned, else createdAt, id. */
export function pickSelectedPromotionContextLocation(
  assignedInCity: readonly BranchContextRow[],
): string | null {
  if (assignedInCity.length === 0) {
    return null;
  }
  const primary = assignedInCity.find((row) => row.isPrimary);
  if (primary) {
    return primary.id;
  }
  const sorted = [...assignedInCity].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
  return sorted[0]!.id;
}

type FeedPromotionContextRow = {
  id: string;
  businessId: string;
};

/**
 * Batch context enrichment for city promotion feed page (no N+1).
 * ALL mode → A.7.9.3A city context; SELECTED → assigned branch in city only.
 */
export async function attachPromotionFeedContextLocationIds<
  T extends FeedPromotionContextRow,
>(
  prisma: Pick<PrismaClient, 'promotionBranchAvailability' | 'businessLocation'>,
  cityId: string,
  items: readonly T[],
): Promise<Array<T & { contextLocationId: string | null }>> {
  if (items.length === 0) {
    return [];
  }

  const promotionIds = items.map((item) => item.id);
  const assignmentRows = await prisma.promotionBranchAvailability.findMany({
    where: { promotionId: { in: promotionIds } },
    select: {
      promotionId: true,
      branchLocation: {
        select: { id: true, cityId: true, isPrimary: true, createdAt: true },
      },
    },
  });

  const assignmentsByPromotionId = new Map<string, BranchContextRow[]>();
  for (const row of assignmentRows) {
    const bucket = assignmentsByPromotionId.get(row.promotionId) ?? [];
    bucket.push(row.branchLocation);
    assignmentsByPromotionId.set(row.promotionId, bucket);
  }

  const allModeBusinessIds = [
    ...new Set(
      items
        .filter((item) => (assignmentsByPromotionId.get(item.id)?.length ?? 0) === 0)
        .map((item) => item.businessId),
    ),
  ];

  const cityContextByBusinessId = await resolveCityContextLocationIds(
    prisma,
    cityId,
    allModeBusinessIds,
  );

  return items.map((item) => {
    const assigned = assignmentsByPromotionId.get(item.id) ?? [];
    let contextLocationId: string | null = null;
    if (assigned.length === 0) {
      contextLocationId = cityContextByBusinessId.get(item.businessId) ?? null;
    } else {
      const inCity = assigned.filter((loc) => loc.cityId === cityId);
      contextLocationId = pickSelectedPromotionContextLocation(inCity);
    }
    return { ...item, contextLocationId };
  });
}
