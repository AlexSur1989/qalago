import { describe, expect, it } from 'vitest';
import { UI_LABELS } from './locale';
import type { BranchAvailability, BusinessLocationRow, CityRow } from './api';
import {
  branchAvailabilityChanged,
  branchAvailabilityFromDto,
  branchAvailabilityToDto,
  DEFAULT_BRANCH_AVAILABILITY,
  formatBranchAvailabilityLabel,
  missingBranchLocationIds,
  setBranchAvailabilityMode,
  toggleBranchLocationSelection,
  validateBranchAvailabilitySubmit,
} from './branch-availability';
import {
  buildPromotionUpdateBody,
  buildServiceItemUpdateBody,
} from './owner-content-edit';

const L1 = 'loc-l1';
const L2 = 'loc-l2';
const L3 = 'loc-l3';
const MISSING = 'loc-missing';

const cities: CityRow[] = [
  { id: 'city-1', slug: 'uralsk', nameRu: 'Уральск', nameKk: 'Орал' },
];

function location(
  id: string,
  address: string,
  isPrimary = false,
): BusinessLocationRow {
  return {
    id,
    businessId: 'biz',
    cityId: 'city-1',
    address,
    latitude: null,
    longitude: null,
    locationSource: null,
    workHours: null,
    phone: null,
    whatsapp: null,
    instagram: null,
    website: null,
    isPrimary,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('branch availability UX model (6.12A.7.8.4)', () => {
  it('A — ALL renders from legacy empty assignments', () => {
    expect(branchAvailabilityFromDto(undefined)).toEqual({ mode: 'ALL', selectedLocationIds: [] });
    expect(branchAvailabilityFromDto({ mode: 'ALL', locationIds: [] })).toEqual({
      mode: 'ALL',
      selectedLocationIds: [],
    });
  });

  it('B — SELECTED renders selected location ids', () => {
    expect(branchAvailabilityFromDto({ mode: 'SELECTED', locationIds: [L1, L3] })).toEqual({
      mode: 'SELECTED',
      selectedLocationIds: [L1, L3],
    });
  });

  it('C — create default ALL payload', () => {
    expect(branchAvailabilityToDto(branchAvailabilityFromDto(DEFAULT_BRANCH_AVAILABILITY))).toEqual({
      mode: 'ALL',
      locationIds: [],
    });
  });

  it('D — ALL→SELECTED submits selected IDs', () => {
    const state = toggleBranchLocationSelection(
      setBranchAvailabilityMode(branchAvailabilityFromDto(DEFAULT_BRANCH_AVAILABILITY), 'SELECTED'),
      L2,
      true,
    );
    expect(branchAvailabilityToDto(state)).toEqual({ mode: 'SELECTED', locationIds: [L2] });
  });

  it('E — SELECTED→ALL submits empty locationIds', () => {
    const state = setBranchAvailabilityMode(
      branchAvailabilityFromDto({ mode: 'SELECTED', locationIds: [L1] }),
      'ALL',
    );
    expect(branchAvailabilityToDto(state)).toEqual({ mode: 'ALL', locationIds: [] });
  });

  it('F — SELECTED with zero known selection blocks submit', () => {
    const state = { mode: 'SELECTED' as const, selectedLocationIds: [] };
    expect(validateBranchAvailabilitySubmit(state, [location(L1, 'ул. A, 1')])).toEqual({
      ok: false,
      reason: 'select_at_least_one',
    });
  });

  it('G1 — unchanged branch with missing id still serializes SELECTED (edit guard is page-level)', () => {
    const initial: BranchAvailability = { mode: 'SELECTED', locationIds: [MISSING] };
    const next: BranchAvailability = { mode: 'SELECTED', locationIds: [MISSING] };
    expect(branchAvailabilityChanged(initial, next)).toBe(false);
  });

  it('G — unrelated edit preserves selection (PATCH omits branchAvailability)', () => {
    const initial: BranchAvailability = { mode: 'SELECTED', locationIds: [L1] };
    const next: BranchAvailability = { mode: 'SELECTED', locationIds: [L1] };
    const body = buildServiceItemUpdateBody(
      {
        title: 'T',
        description: '',
        titleKk: '',
        descriptionKk: '',
        price: '',
        groupId: '',
        isActive: true,
      },
      { initial, next },
    );
    expect(body).not.toHaveProperty('branchAvailability');
  });

  it('H — multiple locations in SELECTED payload', () => {
    const state = {
      mode: 'SELECTED' as const,
      selectedLocationIds: [L3, L1, L2],
    };
    expect(branchAvailabilityToDto(state).locationIds).toEqual([L1, L2, L3]);
  });

  it('I — missing selected location does not become ALL', () => {
    const state = branchAvailabilityFromDto({ mode: 'SELECTED', locationIds: [MISSING] });
    expect(state.mode).toBe('SELECTED');
    expect(missingBranchLocationIds(state, [location(L1, 'ул. A, 1')])).toEqual([MISSING]);
    expect(validateBranchAvailabilitySubmit(state, [location(L1, 'ул. A, 1')])).toEqual({
      ok: false,
      reason: 'missing_unresolved',
    });
  });

  it('J — branch labels and primary badge (RU/KK)', () => {
    const primary = location(L1, 'ул. X, 10', true);
    const secondary = location(L2, 'пр. Y, 20');
    expect(formatBranchAvailabilityLabel('ru', primary, cities, UI_LABELS.ru.branchAvailabilityPrimaryBadge)).toBe(
      'ул. X, 10, Уральск · Основной филиал',
    );
    expect(formatBranchAvailabilityLabel('ru', secondary, cities, UI_LABELS.ru.branchAvailabilityPrimaryBadge)).toBe(
      'пр. Y, 20, Уральск',
    );
    expect(formatBranchAvailabilityLabel('kk', primary, cities, UI_LABELS.kk.branchAvailabilityPrimaryBadge)).toContain(
      'Негізгі филиал',
    );
  });
});

describe('branch availability promotion parity', () => {
  it('promotion PATCH includes branchAvailability when changed', () => {
    const body = buildPromotionUpdateBody(
      {
        title: 'P',
        titleKk: '',
        description: '',
        descriptionKk: '',
        discountText: '-10%',
      },
      {
        initial: { mode: 'ALL', locationIds: [] },
        next: { mode: 'SELECTED', locationIds: [L1] },
      },
    );
    expect(body.branchAvailability).toEqual({ mode: 'SELECTED', locationIds: [L1] });
  });
});

describe('branch availability changed helper', () => {
  it('detects mode and id set changes', () => {
    expect(
      branchAvailabilityChanged({ mode: 'ALL', locationIds: [] }, { mode: 'SELECTED', locationIds: [L1] }),
    ).toBe(true);
    expect(
      branchAvailabilityChanged({ mode: 'SELECTED', locationIds: [L1] }, { mode: 'SELECTED', locationIds: [L2] }),
    ).toBe(true);
    expect(
      branchAvailabilityChanged({ mode: 'ALL', locationIds: [] }, { mode: 'ALL', locationIds: [] }),
    ).toBe(false);
  });
});

describe('branch availability localization keys', () => {
  it('RU/KK headings and modes', () => {
    expect(UI_LABELS.ru.branchAvailabilityHeading).toBe('Доступность по филиалам');
    expect(UI_LABELS.kk.branchAvailabilityHeading).toBe('Филиалдар бойынша қолжетімділік');
    expect(UI_LABELS.ru.branchAvailabilityModeAll).toBe('Во всех филиалах');
    expect(UI_LABELS.kk.branchAvailabilityModeAll).toBe('Барлық филиалдарда');
  });
});
