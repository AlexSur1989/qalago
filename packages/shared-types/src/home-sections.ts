/** Logical home feed sections (CW.3) — shared backend + clients. */
export enum HomeSectionType {
  HOME_VIP_BANNER = 'HOME_VIP_BANNER',
  CATEGORIES = 'CATEGORIES',
  HOME_FEATURED = 'HOME_FEATURED',
  HOME_PROMOTIONS = 'HOME_PROMOTIONS',
  NEARBY = 'NEARBY',
  HOME_POPULAR = 'HOME_POPULAR',
}

export enum HomeSectionPlatform {
  APP = 'APP',
  WEB = 'WEB',
  ALL = 'ALL',
}

export const HOME_SECTION_TYPES = Object.values(HomeSectionType);

export type PublicHomeSectionDto = {
  type: HomeSectionType;
  enabled: boolean;
  position: number;
};

export type AdminHomeSectionRowDto = {
  id: string | null;
  sectionType: HomeSectionType;
  platform: HomeSectionPlatform;
  enabled: boolean;
  position: number;
  scope: 'global' | 'city';
  /** True when effective value comes from global row (no city override row). */
  inherited: boolean;
};

export type AdminHomeSectionsResponseDto = {
  citySlug: string | null;
  cityId: string | null;
  sections: AdminHomeSectionRowDto[];
};

/**
 * Global bootstrap order from Prisma migrations
 * (`20261002100000_cw3_home_section_config` + `20261002110001_web_home2_home_popular_seed`).
 * Used when `/home/sections` is unavailable or returns no enabled rows.
 */
export const HOME_SECTION_CANONICAL_FALLBACK: PublicHomeSectionDto[] = [
  { type: HomeSectionType.HOME_VIP_BANNER, enabled: true, position: 10 },
  { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
  { type: HomeSectionType.HOME_FEATURED, enabled: true, position: 30 },
  { type: HomeSectionType.HOME_PROMOTIONS, enabled: true, position: 40 },
  { type: HomeSectionType.NEARBY, enabled: true, position: 50 },
  { type: HomeSectionType.HOME_POPULAR, enabled: true, position: 60 },
];

/** Normalize public home layout: known types, enabled, sort by position, dedupe by type. */
export function normalizePublicHomeSections(
  rows: PublicHomeSectionDto[],
): PublicHomeSectionDto[] {
  const known = new Set<string>(HOME_SECTION_TYPES);
  const enabled = rows.filter((r) => r.enabled !== false && known.has(r.type));
  const sorted = [...enabled].sort(
    (a, b) =>
      (a.position ?? 0) - (b.position ?? 0) ||
      String(a.type).localeCompare(String(b.type)),
  );
  const seen = new Set<HomeSectionType>();
  const out: PublicHomeSectionDto[] = [];
  for (const row of sorted) {
    if (seen.has(row.type)) continue;
    seen.add(row.type);
    out.push(row);
  }
  return out;
}
