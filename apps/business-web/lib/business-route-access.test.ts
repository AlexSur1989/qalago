import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BusinessPermission,
  type BusinessAccessContext,
} from './business-access';
import {
  BUSINESS_ROUTE_ACCESS,
  canAccessBusinessRoute,
  isBusinessRouteContentAllowed,
} from './business-route-access';

const ownerAccess: BusinessAccessContext = { role: 'OWNER', permissions: [] };
const analyticsManager: BusinessAccessContext = {
  role: 'MANAGER',
  permissions: [BusinessPermission.ANALYTICS_VIEW],
};
const catalogManager: BusinessAccessContext = {
  role: 'MANAGER',
  permissions: [BusinessPermission.CATALOG_EDIT],
};

/** BIZ.9 HOTFIX 4 — fail-closed route access matrix. */
describe('business route access (BIZ.9 HOTFIX 4)', () => {
  it('OWNER passes all operational route requirements', () => {
    for (const key of Object.keys(BUSINESS_ROUTE_ACCESS)) {
      const req = BUSINESS_ROUTE_ACCESS[key as keyof typeof BUSINESS_ROUTE_ACCESS];
      expect(canAccessBusinessRoute(ownerAccess, req)).toBe(true);
    }
  });

  it('ANALYTICS_VIEW manager: dashboard cabinet + statistics only among gated routes', () => {
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.cabinet)).toBe(true);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.analytics)).toBe(true);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.catalog)).toBe(false);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.photos)).toBe(false);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.promotions)).toBe(false);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.reviews)).toBe(false);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.ownerOnly)).toBe(false);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.payments)).toBe(false);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.ads)).toBe(false);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.settings)).toBe(false);
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.businessProfile)).toBe(
      false,
    );
  });

  it('CATALOG_EDIT manager: menu allowed, statistics denied', () => {
    expect(canAccessBusinessRoute(catalogManager, BUSINESS_ROUTE_ACCESS.catalog)).toBe(true);
    expect(canAccessBusinessRoute(catalogManager, BUSINESS_ROUTE_ACCESS.analytics)).toBe(false);
  });

  it('isBusinessRouteContentAllowed requires ready + business', () => {
    expect(
      isBusinessRouteContentAllowed(true, analyticsManager, BUSINESS_ROUTE_ACCESS.catalog, true),
    ).toBe(false);
    expect(
      isBusinessRouteContentAllowed(false, analyticsManager, BUSINESS_ROUTE_ACCESS.analytics, true),
    ).toBe(false);
    expect(
      isBusinessRouteContentAllowed(true, analyticsManager, BUSINESS_ROUTE_ACCESS.analytics, false),
    ).toBe(false);
    expect(
      isBusinessRouteContentAllowed(true, analyticsManager, BUSINESS_ROUTE_ACCESS.analytics, true),
    ).toBe(true);
  });

  it('multi-business: same user different permissions per access context', () => {
    expect(canAccessBusinessRoute(analyticsManager, BUSINESS_ROUTE_ACCESS.catalog)).toBe(false);
    expect(canAccessBusinessRoute(catalogManager, BUSINESS_ROUTE_ACCESS.catalog)).toBe(true);
    expect(canAccessBusinessRoute(catalogManager, BUSINESS_ROUTE_ACCESS.analytics)).toBe(false);
  });
});

const appRoot = join(process.cwd(), 'app');
const componentsRoot = join(process.cwd(), 'components');

function read(rel: string, root = appRoot): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('business route guard wiring (BIZ.9 HOTFIX 4)', () => {
  const deniedPages = [
    'business/[id]/menu/page.tsx',
    'business/[id]/media/page.tsx',
    'business/[id]/promotions/page.tsx',
    'business/[id]/reviews/page.tsx',
    'business/[id]/team/page.tsx',
    'business/[id]/locations/page.tsx',
    'business/[id]/page.tsx',
    'plan/page.tsx',
    'statistics/page.tsx',
    'settings/page.tsx',
  ];

  it.each(deniedPages)('%s renders BusinessSectionAccessDenied when route blocked', (rel) => {
    const src = read(rel);
    expect(src).toContain('BusinessSectionAccessDenied');
    expect(src).toMatch(/routeAllowed|allowed: routeAllowed/);
  });

  it('monetization shell gates ADS_MANAGE before subnav and children', () => {
    const src = read('monetization/monetization-shell.tsx', componentsRoot);
    expect(src).toContain('BUSINESS_ROUTE_ACCESS.ads');
    expect(src).toContain('BusinessSectionAccessDenied');
  });

  const apiGuardPages: Array<{ file: string; api: string }> = [
    { file: 'business/[id]/menu/page.tsx', api: 'listManageServiceItems' },
    { file: 'business/[id]/media/page.tsx', api: 'listBusinessImages' },
    { file: 'business/[id]/promotions/page.tsx', api: 'listPromotions' },
    { file: 'business/[id]/reviews/page.tsx', api: 'listReviews' },
    { file: 'business/[id]/team/page.tsx', api: 'listTeam' },
    { file: 'plan/page.tsx', api: 'getBusinessPlan' },
  ];

  it.each(apiGuardPages)('%s skips protected fetch when routeAllowed is false', ({ file, api }) => {
    const src = read(file);
    expect(src).toContain(api);
    expect(src).toMatch(/!routeAllowed/);
  });

  it('access denied copy uses i18n labels not hardcoded RU in page components', () => {
    const denied = read('business-section-access-denied.tsx', componentsRoot);
    expect(denied).toContain('ownerSectionAccessDeniedTitle');
    expect(denied).not.toMatch(/Нет доступа к этому разделу/);
  });
});
