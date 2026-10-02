import {
  HOME_SECTION_CANONICAL_FALLBACK,
  HomeSectionType,
  normalizePublicHomeSections,
} from '@qalago/shared-types';

describe('6.13M.7 home section normalize (shared contract)', () => {
  it('canonical fallback matches Prisma global bootstrap order', () => {
    expect(HOME_SECTION_CANONICAL_FALLBACK.map((s) => s.type)).toEqual([
      HomeSectionType.HOME_VIP_BANNER,
      HomeSectionType.CATEGORIES,
      HomeSectionType.HOME_FEATURED,
      HomeSectionType.HOME_PROMOTIONS,
      HomeSectionType.NEARBY,
      HomeSectionType.HOME_POPULAR,
    ]);
  });

  it('normalize keeps partial authoritative config without padding', () => {
    const rows = normalizePublicHomeSections([
      { type: HomeSectionType.HOME_FEATURED, enabled: true, position: 30 },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.type).toBe(HomeSectionType.HOME_FEATURED);
  });
});
