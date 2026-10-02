import { describe, expect, it } from 'vitest';
import {
  HomeSectionType,
  HOME_SECTION_CANONICAL_FALLBACK,
  normalizePublicHomeSections,
} from '@qalago/shared-types';

describe('6.13M.7 home section normalize (shared-types)', () => {
  it('canonical fallback matches backend bootstrap positions', () => {
    expect(HOME_SECTION_CANONICAL_FALLBACK.map((s) => s.type)).toEqual([
      HomeSectionType.HOME_VIP_BANNER,
      HomeSectionType.CATEGORIES,
      HomeSectionType.HOME_FEATURED,
      HomeSectionType.HOME_PROMOTIONS,
      HomeSectionType.NEARBY,
      HomeSectionType.HOME_POPULAR,
    ]);
    expect(HOME_SECTION_CANONICAL_FALLBACK[0]?.position).toBe(10);
    expect(HOME_SECTION_CANONICAL_FALLBACK[5]?.position).toBe(60);
  });

  it('sorts by position with type tie-break', () => {
    const normalized = normalizePublicHomeSections([
      { type: HomeSectionType.HOME_PROMOTIONS, enabled: true, position: 40 },
      { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
      { type: HomeSectionType.HOME_VIP_BANNER, enabled: true, position: 10 },
    ]);
    expect(normalized.map((s) => s.type)).toEqual([
      HomeSectionType.HOME_VIP_BANNER,
      HomeSectionType.CATEGORIES,
      HomeSectionType.HOME_PROMOTIONS,
    ]);
  });

  it('omits disabled and unknown types', () => {
    const normalized = normalizePublicHomeSections([
      { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
      { type: HomeSectionType.NEARBY, enabled: false, position: 50 },
      { type: 'FUTURE_SECTION' as HomeSectionType, enabled: true, position: 99 },
    ]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.type).toBe(HomeSectionType.CATEGORIES);
  });

  it('dedupes duplicate section types deterministically', () => {
    const normalized = normalizePublicHomeSections([
      { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
      { type: HomeSectionType.CATEGORIES, enabled: true, position: 25 },
    ]);
    expect(normalized).toHaveLength(1);
  });

  it('partial config does not append missing sections', () => {
    const normalized = normalizePublicHomeSections([
      { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
    ]);
    expect(normalized.map((s) => s.type)).toEqual([HomeSectionType.CATEGORIES]);
  });
});
