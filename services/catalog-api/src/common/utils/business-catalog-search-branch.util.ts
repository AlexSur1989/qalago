import { Prisma } from '@prisma/client';

/** Stable branch ordering for search contextLocationId (matches A.7.9.3A city context). */
export type SearchContextBranchRow = {
  id: string;
  isPrimary: boolean;
  createdAt: Date;
};

export function compareDeterministicSearchContextBranch(
  a: SearchContextBranchRow,
  b: SearchContextBranchRow,
): number {
  if (a.isPrimary !== b.isPrimary) {
    return a.isPrimary ? -1 : 1;
  }
  const byCreated = a.createdAt.getTime() - b.createdAt.getTime();
  if (byCreated !== 0) {
    return byCreated;
  }
  return a.id.localeCompare(b.id);
}

export function pickDeterministicSearchContextBranch<T extends SearchContextBranchRow>(
  branches: readonly T[],
): T | null {
  if (branches.length === 0) {
    return null;
  }
  return [...branches].sort(compareDeterministicSearchContextBranch)[0]!;
}

const insensitiveContains = (search: string): Prisma.StringFilter => ({
  contains: search,
  mode: 'insensitive',
});

/** Business-grain OR branch: BusinessLocation.address in requested city only. */
export function buildBusinessCatalogBranchAddressSearchWhere(
  cityId: string,
  search: string,
): Prisma.BusinessWhereInput {
  return {
    locations: {
      some: {
        cityId,
        address: insensitiveContains(search),
      },
    },
  };
}

export type ServiceItemBranchAvailabilityRow = {
  locationId: string;
  branchLocation: {
    id: string;
    cityId: string;
    isPrimary: boolean;
    createdAt: Date;
  };
};

/**
 * A.7.9.3B — zero SIBA rows = ALL branches; ≥1 = SELECTED only.
 * City C: ALL qualifies when business already has a branch in C (caller scope);
 * SELECTED qualifies only when an assignment points to a branch in C.
 */
export function evaluateServiceItemSearchBranchAvailabilityInCity(
  branchAvailabilities: readonly ServiceItemBranchAvailabilityRow[],
  cityId: string,
): { eligible: boolean; selectedContextLocation: SearchContextBranchRow | null } {
  const assignments = branchAvailabilities ?? [];
  if (assignments.length === 0) {
    return { eligible: true, selectedContextLocation: null };
  }
  const inCity = assignments
    .map((row) => row.branchLocation)
    .filter((loc) => loc.cityId === cityId);
  if (inCity.length === 0) {
    return { eligible: false, selectedContextLocation: null };
  }
  return {
    eligible: true,
    selectedContextLocation: pickDeterministicSearchContextBranch(inCity),
  };
}
