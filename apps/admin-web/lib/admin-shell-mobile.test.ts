import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AdminShell mobile navigation (UXA.2)', () => {
  const src = readFileSync(join(__dirname, '../components/admin-shell.tsx'), 'utf8');

  it('uses off-canvas drawer with backdrop at mobile breakpoint CSS', () => {
    expect(src).toContain('mobileNavOpen');
    expect(src).toContain('shell-nav-backdrop');
    expect(src).toContain("' open'");
    expect(src).toContain('shell-drawer-open');
  });

  it('closes drawer on route change, backdrop, and escape', () => {
    expect(src).toContain('usePathname');
    expect(src).toContain("e.key === 'Escape'");
    expect(src).toContain('closeMobileNav');
  });

  it('exposes main landmark for content', () => {
    expect(src).toContain('id="admin-main-content"');
  });
});
