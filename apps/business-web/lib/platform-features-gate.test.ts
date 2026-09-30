import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPermissionScopedShellNav } from './business-access';

describe('platform business team runtime gate (BIZ.9 HOTFIX 5B)', () => {
  const ownerAccess = { role: 'OWNER' as const, permissions: [] as string[] };

  it('hides team nav unless businessTeamEnabled is true', () => {
    const off = buildPermissionScopedShellNav('ru', ownerAccess, { businessTeamEnabled: false });
    const on = buildPermissionScopedShellNav('ru', ownerAccess, { businessTeamEnabled: true });
    expect(off.mainNav.some((i) => i.id === 'team')).toBe(false);
    expect(on.mainNav.some((i) => i.id === 'team')).toBe(true);
  });

  it('team page wires platform unavailable vs permission denied', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/business/[id]/team/page.tsx'),
      'utf8',
    );
    expect(src).toContain('BusinessPlatformFeatureUnavailable');
    expect(src).toContain('usePlatformFeatures');
    expect(src).toMatch(/!features\.businessTeamEnabled/);
    expect(src).toContain('listTeam');
    expect(src).toMatch(/!routeAllowed|routeAllowed/);
  });

  it('shell loads platform features before showing team nav', () => {
    const shell = readFileSync(join(process.cwd(), 'components/business-shell.tsx'), 'utf8');
    expect(shell).toContain('usePlatformFeatures');
    expect(shell).toContain('buildPermissionScopedShellNav');
  });
});
