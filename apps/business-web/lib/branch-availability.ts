import type { AppLocale } from '@/lib/locale';
import type { BranchAvailability, BusinessLocationRow, CityRow } from '@/lib/api';
import { cityDisplayName } from '@/lib/localized-content';

export type BranchAvailabilityMode = BranchAvailability['mode'];

export type BranchAvailabilityUiState = {
  mode: BranchAvailabilityMode;
  /** Selected location ids (includes missing/unlisted ids from server). */
  selectedLocationIds: string[];
};

export const DEFAULT_BRANCH_AVAILABILITY: BranchAvailability = {
  mode: 'ALL',
  locationIds: [],
};

export function sortBranchLocations(locations: BusinessLocationRow[]): BusinessLocationRow[] {
  return [...locations].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

export function formatBranchAvailabilityLabel(
  locale: AppLocale,
  location: BusinessLocationRow,
  cities: CityRow[],
  primaryBadge: string,
): string {
  const city = cities.find((row) => row.id === location.cityId);
  const cityLabel = city ? cityDisplayName(city, locale) : '';
  const address = location.address.trim();
  const parts = [address, cityLabel].filter(Boolean);
  const base = parts.join(', ');
  if (location.isPrimary) {
    return `${base} · ${primaryBadge}`;
  }
  return base || address;
}

export function branchAvailabilityFromDto(
  dto: BranchAvailability | null | undefined,
): BranchAvailabilityUiState {
  if (!dto || dto.mode === 'ALL') {
    return { mode: 'ALL', selectedLocationIds: [] };
  }
  return {
    mode: 'SELECTED',
    selectedLocationIds: [...dto.locationIds],
  };
}

export function branchAvailabilityToDto(state: BranchAvailabilityUiState): BranchAvailability {
  if (state.mode === 'ALL') {
    return { mode: 'ALL', locationIds: [] };
  }
  return {
    mode: 'SELECTED',
    locationIds: [...state.selectedLocationIds].sort(),
  };
}

export function missingBranchLocationIds(
  state: BranchAvailabilityUiState,
  knownLocations: BusinessLocationRow[],
): string[] {
  if (state.mode !== 'SELECTED') return [];
  const known = new Set(knownLocations.map((row) => row.id));
  return state.selectedLocationIds.filter((id) => !known.has(id));
}

export function knownSelectedLocationIds(
  state: BranchAvailabilityUiState,
  knownLocations: BusinessLocationRow[],
): string[] {
  const known = new Set(knownLocations.map((row) => row.id));
  return state.selectedLocationIds.filter((id) => known.has(id));
}

export type BranchAvailabilityValidation =
  | { ok: true }
  | { ok: false; reason: 'no_branches' | 'select_at_least_one' | 'missing_unresolved' };

export function validateBranchAvailabilitySubmit(
  state: BranchAvailabilityUiState,
  knownLocations: BusinessLocationRow[],
): BranchAvailabilityValidation {
  if (state.mode === 'ALL') {
    return { ok: true };
  }
  if (knownLocations.length === 0) {
    return { ok: false, reason: 'no_branches' };
  }
  const missing = missingBranchLocationIds(state, knownLocations);
  if (missing.length > 0) {
    return { ok: false, reason: 'missing_unresolved' };
  }
  const selectedKnown = knownSelectedLocationIds(state, knownLocations);
  if (selectedKnown.length === 0) {
    return { ok: false, reason: 'select_at_least_one' };
  }
  return { ok: true };
}

export function branchAvailabilityChanged(
  initial: BranchAvailability,
  next: BranchAvailability,
): boolean {
  if (initial.mode !== next.mode) return true;
  if (next.mode === 'ALL') return false;
  const a = [...initial.locationIds].sort();
  const b = [...next.locationIds].sort();
  return a.length !== b.length || a.some((id, index) => id !== b[index]);
}

export function toggleBranchLocationSelection(
  state: BranchAvailabilityUiState,
  locationId: string,
  checked: boolean,
): BranchAvailabilityUiState {
  const set = new Set(state.selectedLocationIds);
  if (checked) {
    set.add(locationId);
  } else {
    set.delete(locationId);
  }
  return {
    mode: 'SELECTED',
    selectedLocationIds: [...set].sort(),
  };
}

export function setBranchAvailabilityMode(
  state: BranchAvailabilityUiState,
  mode: BranchAvailabilityMode,
): BranchAvailabilityUiState {
  if (mode === 'ALL') {
    return { mode: 'ALL', selectedLocationIds: [] };
  }
  if (state.mode === 'SELECTED' && state.selectedLocationIds.length > 0) {
    return { mode: 'SELECTED', selectedLocationIds: [...state.selectedLocationIds] };
  }
  return { mode: 'SELECTED', selectedLocationIds: [] };
}
