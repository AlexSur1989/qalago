import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HomeSectionType } from '@qalago/shared-types';
import { describe, expect, it, vi } from 'vitest';
import {
  HOME_SECTION_CONFIG_FALLBACK,
  fetchPublicHomeSectionsSafe,
  orderedSectionTypes,
} from './home-sections-api';
import { layoutIncludes, sectionTypesFromLayout } from './home-section-layout';
import { UI_LABELS } from './locale';

const APP_ROOT = join(import.meta.dirname, '..');

describe('CW.4 discovery home', () => {
  it('orders sections exactly as API rows (no client re-sort)', () => {
    const rows = [
      { type: HomeSectionType.HOME_PROMOTIONS, enabled: true, position: 40 },
      { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
    ];
    expect(orderedSectionTypes(rows)).toEqual([
      HomeSectionType.HOME_PROMOTIONS,
      HomeSectionType.CATEGORIES,
    ]);
  });

  it('uses categories-only documented fallback when config fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
    );
    const result = await fetchPublicHomeSectionsSafe('uralsk');
    expect(result.ok).toBe(false);
    expect(HOME_SECTION_CONFIG_FALLBACK.map((s) => s.type)).toEqual([
      HomeSectionType.CATEGORIES,
    ]);
    vi.unstubAllGlobals();
  });

  it('layoutIncludes respects configured types', () => {
    const layout = {
      sections: [
        { type: HomeSectionType.CATEGORIES, enabled: true, position: 20 },
      ],
      usedConfigFallback: false,
    };
    expect(layoutIncludes(HomeSectionType.CATEGORIES, layout)).toBe(true);
    expect(layoutIncludes(HomeSectionType.HOME_PROMOTIONS, layout)).toBe(false);
    expect(sectionTypesFromLayout(layout)).toEqual([HomeSectionType.CATEGORIES]);
  });

  it('city home page uses HomeDiscoverySections (config-driven)', () => {
    const src = readFileSync(
      join(APP_ROOT, 'app/[locale]/[citySlug]/page.tsx'),
      'utf8',
    );
    expect(src).toContain('HomeDiscoverySections');
    expect(src).toContain('loadHomeDiscoveryPageData');
    expect(src).not.toContain('sliceHomeCategories');
  });

  it('delegates ad-backed sections to CW.6 loaders (config-gated)', () => {
    const src = readFileSync(join(APP_ROOT, 'lib/home-discovery-data.ts'), 'utf8');
    expect(src).toContain('fetchAdServe');
    expect(src).toContain('layoutIncludes(HomeSectionType.HOME_VIP_BANNER');
  });

  it('promotions section has no link to reserved promotions route', () => {
    const src = readFileSync(
      join(APP_ROOT, 'components/home/HomePromotionsSection.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/href=\{[^}]*\/promotions['"`]/);
    expect(src).not.toMatch(/['"`]\/[^'"]*\/promotions['"`]/);
  });

  it('home sections fetch uses no-store for admin-controlled layout', () => {
    const src = readFileSync(join(APP_ROOT, 'lib/home-sections-api.ts'), 'utf8');
    expect(src).toContain("cache: 'no-store'");
  });

  it('RU/KK labels for home promotions section', () => {
    for (const locale of ['ru', 'kk'] as const) {
      expect(UI_LABELS[locale].homeSectionPromotions.length).toBeGreaterThan(2);
      expect(UI_LABELS[locale].emptyHomePromotions.length).toBeGreaterThan(10);
    }
  });
});
