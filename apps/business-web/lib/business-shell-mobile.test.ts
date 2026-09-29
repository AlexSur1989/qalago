import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const shellPath = join(process.cwd(), 'components', 'business-shell.tsx');

function readShell(): string {
  return readFileSync(shellPath, 'utf8');
}

describe('BusinessShell mobile navigation (6.10D.1)', () => {
  it('toggles sidebar.open and provides menu control', () => {
    const src = readShell();
    expect(src).toContain("' open'");
    expect(src).toContain('mobileNavOpen');
    expect(src).toContain('shellOpenNavigation');
    expect(src).toContain('shellCloseNavigation');
    expect(src).toContain('shell-nav-backdrop');
  });

  it('closes drawer on route change, backdrop, escape, and nav selection', () => {
    const src = readShell();
    expect(src).toContain('usePathname');
    expect(src).toContain("e.key === 'Escape'");
    expect(src).toContain('onNavigate={closeMobileNav}');
    expect(src).toContain('onClick={closeMobileNav}');
  });

  it('centralizes permission-scoped nav in shell (BIZ.9 HOTFIX 2)', () => {
    const src = readShell();
    expect(src).toContain('buildPermissionScopedShellNav');
    expect(src).toContain('useBusinessAccess');
    expect(src).not.toContain('mainNav ?? buildMainNavItems');
    expect(src).not.toMatch(/const mobileNavItems/);
  });

  it('keeps business switcher in sidebar and collapse control desktop-only', () => {
    const src = readShell();
    expect(src).toContain('selectBusiness');
    expect(src).toContain('businesses.length > 1');
    expect(src).toContain('collapse-btn desktop-only');
  });
});
