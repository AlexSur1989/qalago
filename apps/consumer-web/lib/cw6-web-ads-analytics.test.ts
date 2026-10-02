import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HomeSectionType } from '@qalago/shared-types';
import { describe, expect, it, vi } from 'vitest';
import { AD_PLACEMENT } from './ad-placements';
import { adBusinessHref, vipBannerNavigateTarget } from './ad-navigation';
import { applyCategoryOrganicDedupe } from './category-ads-data';
import { collectPaidBusinessIds, categoryAllPlacesAfterSponsored } from './ads-dedupe';
import { parseAdServeItem } from './ads-api';
import { layoutIncludes } from './home-section-layout';
import { generateWebSessionIdForTests, isValidWebSessionId } from './web-session';
import { UI_LABELS } from './locale';
import {
  hasAdImpressionBeenSent,
  markAdImpressionSent,
  resetAdImpressionSessionForTests,
} from './ad-impression-session';

const APP_ROOT = join(import.meta.dirname, '..');

describe('CW.6 web ads + analytics', () => {
  it('fetchAdServe uses platform=WEB and no-store', () => {
    const src = readFileSync(join(APP_ROOT, 'lib/ads-api.ts'), 'utf8');
    expect(src).toContain("platform: 'WEB'");
    expect(src).toContain("cache: 'no-store'");
    expect(src).toContain('/monetization/ads/serve');
  });

  it('does not fetch VIP ads when section disabled in loader', () => {
    const src = readFileSync(join(APP_ROOT, 'lib/home-discovery-data.ts'), 'utf8');
    expect(src).toContain('layoutIncludes(HomeSectionType.HOME_VIP_BANNER');
    expect(src).toContain('loadAdPlacement(needsVip');
    expect(src).not.toMatch(/fetchAdServe[\s\S]*HOME_VIP_BANNER[\s\S]*always/i);
  });

  it('HOME_VIP_BANNER rendering component requires creative', () => {
    const src = readFileSync(join(APP_ROOT, 'components/ads/HomeVipBannerAd.tsx'), 'utf8');
    expect(src).toContain('AdViewabilityTracker');
    expect(src).toContain('SponsoredLabel');
  });

  it('HOME_FEATURED uses sponsored business cards only', () => {
    const src = readFileSync(join(APP_ROOT, 'components/ads/HomeFeaturedAdsSection.tsx'), 'utf8');
    expect(src).toContain('SponsoredBusinessAdCard');
    expect(src).not.toMatch(/fetchBusinesses|organic/i);
  });

  it('empty ad response yields no home VIP section branch', () => {
    const src = readFileSync(join(APP_ROOT, 'components/home/HomeDiscoverySections.tsx'), 'utf8');
    expect(src).toMatch(/vipBanner\.status !== 'ready' \|\| !vipBanner\.data\.length/);
  });

  it('ad API failure returns empty items array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
    );
    const { fetchAdServe } = await import('./ads-api');
    const items = await fetchAdServe({
      placementCode: AD_PLACEMENT.HOME_FEATURED,
      citySlug: 'uralsk',
      sessionId: 'abc123456789012345678901234567890',
    });
    expect(items).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('sponsored label RU/KK', () => {
    expect(UI_LABELS.ru.adLabel).toBe('Реклама');
    expect(UI_LABELS.kk.adLabel).toBe('Жарнама');
  });

  it('category organic page preserves API page size (6.13M.6)', () => {
    const ads = [
      parseAdServeItem({
        campaignId: 'c1',
        placementId: 'p1',
        placementCode: 'CATEGORY_TOP',
        business: { id: 'b-paid', slug: 'paid', title: 'Paid' },
      })!,
    ];
    const paid = collectPaidBusinessIds(ads);
    const organic = [{ id: 'b-paid' }, { id: 'b-org' }];
    const result = applyCategoryOrganicDedupe(organic, ads);
    expect(result.map((b) => b.id)).toEqual(['b-paid', 'b-org']);
    expect(paid.has('b-paid')).toBe(true);
  });

  it('categoryAllPlacesAfterSponsored skips duplicate head', () => {
    const trimmed = categoryAllPlacesAfterSponsored(
      [{ id: 'x' }, { id: 'y' }],
      ['x'],
    );
    expect(trimmed.map((b) => b.id)).toEqual(['y']);
  });

  it('canonical ad business links include locationId when served', () => {
    const item = parseAdServeItem({
      campaignId: 'c',
      placementId: 'p',
      placementCode: 'HOME_FEATURED',
      destinationLocationId: 'loc-1',
      business: { id: 'b1', slug: 'cafe', title: 'Cafe' },
    })!;
    expect(adBusinessHref('ru', 'uralsk', item)).toBe(
      '/ru/uralsk/business/cafe?locationId=loc-1',
    );
  });

  it('web session ids are 32-char hex', () => {
    const id = generateWebSessionIdForTests();
    expect(isValidWebSessionId(id)).toBe(true);
    expect(isValidWebSessionId('not-valid')).toBe(false);
  });

  it('web session cookie is set in middleware not RSC', () => {
    const serverSrc = readFileSync(join(APP_ROOT, 'lib/web-session-server.ts'), 'utf8');
    expect(serverSrc).not.toContain('.set(');
    const mwSrc = readFileSync(join(APP_ROOT, 'middleware.ts'), 'utf8');
    expect(mwSrc).toContain('setWebSessionCookieOnResponse');
  });

  it('impression dedupe is session-local per campaign+placement', () => {
    resetAdImpressionSessionForTests();
    expect(hasAdImpressionBeenSent('c1', 'p1')).toBe(false);
    markAdImpressionSent('c1', 'p1');
    expect(hasAdImpressionBeenSent('c1', 'p1')).toBe(true);
    expect(hasAdImpressionBeenSent('c1', 'p2')).toBe(false);
  });

  it('analytics client posts platform WEB', () => {
    const src = readFileSync(join(APP_ROOT, 'lib/analytics-client.ts'), 'utf8');
    expect(src).toContain("platform: 'WEB'");
    expect(src).toContain('/analytics/events');
    expect(src).toContain('/monetization/ads/events');
  });

  it('contact analytics hooks do not remove href', () => {
    const src = readFileSync(join(APP_ROOT, 'components/analytics/TrackedContactLink.tsx'), 'utf8');
    expect(src).toContain('href={href}');
    expect(src).toContain('postOrganicAnalyticsEvent');
    expect(src).not.toContain('trafficSource');
    expect(src).not.toContain('discoverySurface');
  });

  it('consumer ad disclosure is locale-only (ignores serve displayLabel)', () => {
    const src = readFileSync(join(APP_ROOT, 'components/ads/SponsoredLabel.tsx'), 'utf8');
    expect(src).toContain('consumerSponsoredLabel');
    expect(src).not.toContain('GENERIC_AD_DISCLOSURE');
  });

  it('organic home promotions stay separate from paid strip', () => {
    const src = readFileSync(join(APP_ROOT, 'components/home/HomeDiscoverySections.tsx'), 'utf8');
    expect(src).toContain('HomePromotionsSection');
    expect(src).toContain('HomePromotionsPaidStrip');
  });

  it('HOME_PROMOTIONS paid uses serve placement not organic API', () => {
    const src = readFileSync(join(APP_ROOT, 'lib/home-discovery-data.ts'), 'utf8');
    expect(src).toContain('AD_PLACEMENT.HOME_PROMOTIONS');
    expect(src).toContain('fetchCityPromotionsPreview');
  });

  it('no auth dependency in ads layer', () => {
    const adsSrc = readFileSync(join(APP_ROOT, 'lib/ads-api.ts'), 'utf8');
    expect(adsSrc).not.toMatch(/Authorization|login|session\.user/i);
  });

  it('vip external url navigation only from creative target', () => {
    const item = parseAdServeItem({
      campaignId: 'c',
      placementId: 'p',
      placementCode: 'HOME_VIP_BANNER',
      creative: {
        id: 'cr',
        title: 'T',
        targetType: 'EXTERNAL_URL',
        targetUrl: 'https://example.com/p',
      },
    })!;
    const target = vipBannerNavigateTarget('ru', 'uralsk', item);
    expect(target).toEqual({ kind: 'external', url: 'https://example.com/p' });
  });

  it('layoutIncludes gates ad fetches', () => {
    const layout = {
      sections: [{ type: HomeSectionType.HOME_FEATURED, enabled: true, position: 30 }],
      usedConfigFallback: false,
    };
    expect(layoutIncludes(HomeSectionType.HOME_FEATURED, layout)).toBe(true);
    expect(layoutIncludes(HomeSectionType.HOME_VIP_BANNER, layout)).toBe(false);
  });
});
