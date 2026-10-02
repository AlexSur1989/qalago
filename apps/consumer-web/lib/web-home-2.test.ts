import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HomeSectionType } from '@qalago/shared-types';
import { describe, expect, it, vi } from 'vitest';
import { collectPaidBusinessIds } from './collect-paid-business-ids';
import { layoutIncludes } from './home-section-layout';
import { UI_LABELS } from './locale';
import {
  MAX_USER_DISTANCE_FROM_CITY_METERS,
  nearbyUsesUserGps,
  resolveNearbySearchPosition,
  sortNearbyBusinesses,
} from './nearby-geo';
import { loadHomePopularSection } from './home-popular-data';

const APP_ROOT = join(import.meta.dirname, '..');

describe('WEB-HOME.2 discovery parity', () => {
  it('NEARBY section renders client island (not null)', () => {
    const src = readFileSync(
      join(APP_ROOT, 'components/home/HomeDiscoverySections.tsx'),
      'utf8',
    );
    expect(src).toContain('HomeNearbySection');
    expect(src).toContain('case HomeSectionType.NEARBY');
    expect(src).not.toContain('case HomeSectionType.NEARBY:\n            return null');
  });

  it('HOME_POPULAR wired in discovery renderer and loader', () => {
    const sectionsSrc = readFileSync(
      join(APP_ROOT, 'components/home/HomeDiscoverySections.tsx'),
      'utf8',
    );
    const dataSrc = readFileSync(join(APP_ROOT, 'lib/home-discovery-data.ts'), 'utf8');
    expect(sectionsSrc).toContain('HomeSectionType.HOME_POPULAR');
    expect(sectionsSrc).toContain('HomePopularOrganicSection');
    expect(dataSrc).toContain('HomeSectionType.HOME_POPULAR');
    expect(dataSrc).toContain('loadHomePopularSection');
  });

  it('layoutIncludes gates NEARBY and POPULAR fetches', () => {
    const layout = {
      sections: [{ type: HomeSectionType.NEARBY, enabled: true, position: 50 }],
      usedConfigFallback: false,
    };
    expect(layoutIncludes(HomeSectionType.NEARBY, layout)).toBe(true);
    expect(layoutIncludes(HomeSectionType.HOME_POPULAR, layout)).toBe(false);
  });

  it('geo: uses GPS copy only when within city bounds', () => {
    const city = { centerLat: 51.23, centerLng: 51.39 };
    const nearUser = { latitude: 51.231, longitude: 51.391 };
    const farUser = { latitude: 52.0, longitude: 51.39 };
    expect(nearbyUsesUserGps(nearUser, city)).toBe(true);
    expect(nearbyUsesUserGps(farUser, city)).toBe(false);
    expect(nearbyUsesUserGps(nearUser, null)).toBe(true);
    expect(MAX_USER_DISTANCE_FROM_CITY_METERS).toBe(25_000);
  });

  it('geo: city-center fallback when permission denied', () => {
    const pos = resolveNearbySearchPosition(null, { centerLat: 51.2, centerLng: 51.4 });
    expect(pos).toEqual({ latitude: 51.2, longitude: 51.4 });
  });

  it('geo: unavailable path falls back to city center (no crash contract)', async () => {
    const { readBrowserGeolocationOnce } = await import('./browser-geolocation');
    vi.stubGlobal('navigator', {});
    const result = await readBrowserGeolocationOnce();
    expect(result.status).toBe('unsupported');
    vi.unstubAllGlobals();
    expect(
      resolveNearbySearchPosition(null, { centerLat: 51.2278, centerLng: 51.3865 }),
    ).toEqual({ latitude: 51.2278, longitude: 51.3865 });
  });

  it('sortNearbyBusinesses prefers distance then title', () => {
    const sorted = sortNearbyBusinesses([
      { title: 'B', distanceMeters: 500 },
      { title: 'A', distanceMeters: 100 },
      { title: 'C', distanceMeters: 100 },
    ]);
    expect(sorted.map((x) => x.title)).toEqual(['A', 'C', 'B']);
  });

  it('popular organic excludes paid featured business ids', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/ai/recommendations')) {
          return {
            ok: false,
            status: 503,
            json: async () => ({}),
          };
        }
        if (url.includes('/businesses?')) {
          return {
            ok: true,
            json: async () => ({
              items: [
                { id: 'paid-1', title: 'Paid', slug: 'paid', address: 'a' },
                { id: 'org-1', title: 'Org', slug: 'org', address: 'b' },
              ],
              total: 2,
              page: 1,
              limit: 10,
            }),
          };
        }
        throw new Error(`unexpected fetch ${url}`);
      }),
    );

    const result = await loadHomePopularSection('uralsk', [
      {
        campaignId: 'c1',
        placementId: 'p1',
        placementCode: 'HOME_FEATURED',
        position: 1,
        sponsored: true,
        displayLabel: 'Ad',
        business: { id: 'paid-1', title: 'Paid', slug: 'paid' },
      },
    ]);

    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.data.map((x) => x.id)).toEqual(['org-1']);
      expect(result.meta?.source).toBe('organic');
    }
    vi.unstubAllGlobals();
  });

  it('collectPaidBusinessIds mirrors mobile ad dedupe', () => {
    const ids = collectPaidBusinessIds([
      {
        campaignId: 'c',
        placementId: 'p',
        placementCode: 'HOME_FEATURED',
        position: 1,
        sponsored: true,
        displayLabel: 'Ad',
        business: { id: 'b1', title: 'T', slug: 't' },
      },
    ]);
    expect(ids.has('b1')).toBe(true);
  });

  it('organic analytics surfaces (no AD_CLICK in nearby/popular components)', () => {
    const linkSrc = readFileSync(
      join(APP_ROOT, 'components/analytics/TrackedOrganicBusinessLink.tsx'),
      'utf8',
    );
    const featuredSrc = readFileSync(
      join(APP_ROOT, 'components/ads/HomeFeaturedAdsSection.tsx'),
      'utf8',
    );
    expect(linkSrc).toContain('postOrganicAnalyticsEvent');
    expect(linkSrc).not.toContain('AD_CLICK');
    expect(featuredSrc).toContain('SponsoredBusinessAdCard');
  });

  it('RU/KK labels for nearby and popular', () => {
    for (const locale of ['ru', 'kk'] as const) {
      expect(UI_LABELS[locale].homeSectionPopular.length).toBeGreaterThan(2);
      expect(UI_LABELS[locale].homeNearbySection.length).toBeGreaterThan(2);
      expect(UI_LABELS[locale].homeNearbyCitySection.length).toBeGreaterThan(5);
    }
  });

  it('HOME_FEATURED remains sponsored path', () => {
    const src = readFileSync(
      join(APP_ROOT, 'components/home/HomeDiscoverySections.tsx'),
      'utf8',
    );
    expect(src).toContain('HomeFeaturedAdsSection');
    const featuredSrc = readFileSync(
      join(APP_ROOT, 'components/ads/HomeFeaturedAdsSection.tsx'),
      'utf8',
    );
    expect(featuredSrc).toContain('SponsoredBusinessAdCard');
  });
});
