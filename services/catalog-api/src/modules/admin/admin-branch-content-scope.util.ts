export type AdminBranchScopeMode = 'ALL' | 'SELECTED';

function normalizeAssignmentLocationIds(locationIds: string[]): string[] {
  return [...new Set(locationIds.map((id) => id.trim()).filter(Boolean))].sort();
}

export type AdminBranchScopeBranchDto = {
  locationId: string;
  address: string | null;
  cityNameRu: string | null;
  cityNameKk: string | null;
  isPrimary: boolean;
  available: boolean;
};

export type AdminBranchScopeDto = {
  mode: AdminBranchScopeMode;
  branches: AdminBranchScopeBranchDto[];
};

export type AdminBranchLocationRow = {
  id: string;
  address: string;
  isPrimary: boolean;
  city: { nameRu: string; nameKk?: string | null } | null;
};

/** Resolve assignment locationIds to staff-facing branch scope (same business only). */
export function buildAdminBranchScope(
  assignmentLocationIds: string[],
  locationById: ReadonlyMap<string, AdminBranchLocationRow>,
): AdminBranchScopeDto {
  const normalized = normalizeAssignmentLocationIds(assignmentLocationIds);
  if (normalized.length === 0) {
    return { mode: 'ALL', branches: [] };
  }

  return {
    mode: 'SELECTED',
    branches: normalized.map((locationId) => {
      const loc = locationById.get(locationId);
      if (!loc) {
        return {
          locationId,
          address: null,
          cityNameRu: null,
          cityNameKk: null,
          isPrimary: false,
          available: false,
        };
      }
      return {
        locationId,
        address: loc.address,
        cityNameRu: loc.city?.nameRu ?? null,
        cityNameKk: loc.city?.nameKk ?? null,
        isPrimary: loc.isPrimary,
        available: true,
      };
    }),
  };
}

export function groupAssignmentLocationIds<T>(
  rows: readonly T[],
  entityIdOf: (row: T) => string,
  locationIdOf: (row: T) => string,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const entityId = entityIdOf(row);
    const bucket = map.get(entityId) ?? [];
    bucket.push(locationIdOf(row));
    map.set(entityId, bucket);
  }
  return map;
}
