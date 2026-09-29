import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BusinessPermission,
  buildMainNavItems,
  buildPermissionScopedShellNav,
} from './business-access';

const analyticsOnlyManager = {
  role: 'MANAGER' as const,
  permissions: [BusinessPermission.ANALYTICS_VIEW],
};

const catalogManager = {
  role: 'MANAGER' as const,
  permissions: [BusinessPermission.CATALOG_EDIT],
};

const ownerAccess = { role: 'OWNER' as const, permissions: [] as string[] };

function sidebarIds(locale: 'ru' = 'ru', access: Parameters<typeof buildPermissionScopedShellNav>[1]) {
  const { mainNav, footerNav } = buildPermissionScopedShellNav(locale, access);
  return {
    main: mainNav.map((i) => i.id),
    footer: footerNav.map((i) => i.id),
  };
}

/** BIZ.9 HOTFIX 2 — centralized BusinessShell permission-scoped sidebar. */
describe('manager sidebar centralized (BIZ.9 HOTFIX 2)', () => {
  const analyticsSidebar = () => sidebarIds('ru', analyticsOnlyManager);

  it('ANALYTICS_VIEW manager: Обзор + Статистика + footer Помощь only', () => {
    const { main, footer } = analyticsSidebar();
    expect(main).toEqual(['home', 'stats']);
    expect(footer).toEqual(['help']);
  });

  it('same sidebar on /dashboard and /statistics (route-agnostic builder)', () => {
    const dash = analyticsSidebar();
    const stats = analyticsSidebar();
    expect(dash).toEqual(stats);
  });

  it('sidebar does not broaden on business profile route context', () => {
    expect(analyticsSidebar().main).not.toContain('profile');
    expect(analyticsSidebar().main).not.toContain('menu');
    expect(analyticsSidebar().main).not.toContain('promotions');
  });

  it('sidebar does not broaden on menu or promotions route context', () => {
    const { main } = analyticsSidebar();
    expect(main).not.toContain('menu');
    expect(main).not.toContain('promotions');
    expect(main).not.toContain('monetization');
  });

  it('sidebar does not broaden on monetization route context', () => {
    expect(analyticsSidebar().main).not.toContain('monetization');
  });

  it('OWNER retains full canonical main navigation', () => {
    const { main, footer } = sidebarIds('ru', ownerAccess);
    const templateIds = buildMainNavItems('ru').map((i) => i.id);
    expect(main).toEqual(templateIds);
    expect(main).toContain('team');
    expect(main).toContain('monetization');
    expect(footer.some((id) => id === 'plan')).toBe(true);
  });

  it('unresolved access yields empty nav (no owner fallback)', () => {
    expect(sidebarIds('ru', null).main).toEqual([]);
    expect(sidebarIds('ru', null).footer).toEqual([]);
    expect(sidebarIds('ru', undefined).main).toEqual([]);
  });

  it('multi-business: CATALOG_EDIT vs ANALYTICS_VIEW sidebars differ', () => {
    const catalog = sidebarIds('ru', catalogManager);
    const analytics = sidebarIds('ru', analyticsOnlyManager);
    expect(catalog.main).toContain('menu');
    expect(catalog.main).not.toContain('stats');
    expect(analytics.main).toContain('stats');
    expect(analytics.main).not.toContain('menu');
  });

  it('switching access removes stale permissions from sidebar', () => {
    const first = sidebarIds('ru', catalogManager).main;
    const second = sidebarIds('ru', analyticsOnlyManager).main;
    expect(first).toContain('menu');
    expect(second).not.toContain('menu');
  });

  it('F5 /statistics: pages rely on BusinessShell, not per-page nav props', () => {
    const statisticsSrc = readFileSync(
      join(process.cwd(), 'app', 'statistics', 'page.tsx'),
      'utf8',
    );
    expect(statisticsSrc).not.toMatch(/mainNav=\{/);
    expect(statisticsSrc).not.toMatch(/footerNav=\{/);
  });

  it('BusinessShell centralizes filterNavByAccess via buildPermissionScopedShellNav', () => {
    const shellSrc = readFileSync(join(process.cwd(), 'components', 'business-shell.tsx'), 'utf8');
    expect(shellSrc).toContain('buildPermissionScopedShellNav');
    expect(shellSrc).not.toContain('mainNav ?? buildMainNavItems');
    expect(shellSrc).not.toMatch(/mainNav\?:/);
  });

  const routePages = [
    'app/dashboard/page.tsx',
    'app/statistics/page.tsx',
    'app/messages/page.tsx',
    'app/help/page.tsx',
    'app/settings/page.tsx',
    'app/plan/page.tsx',
    'app/business/[id]/page.tsx',
    'app/business/[id]/menu/page.tsx',
    'app/business/[id]/promotions/page.tsx',
  ];

  it.each(routePages)('%s does not pass sidebar override props', (relPath) => {
    const src = readFileSync(join(process.cwd(), relPath), 'utf8');
    expect(src).not.toMatch(/mainNav=\{/);
    expect(src).not.toMatch(/footerNav=\{/);
  });
});
