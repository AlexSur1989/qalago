import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('useAuth bootstrap wiring (AOP.7H.3 + BIZ.9 HOTFIX 6)', () => {
  const src = readFileSync(join(__dirname, 'use-auth.ts'), 'utf8');
  const bootstrapSrc = readFileSync(join(__dirname, 'admin-auth-bootstrap.ts'), 'utf8');

  it('delegates session restore to shared runAdminAuthBootstrap', () => {
    expect(src).toContain('runAdminAuthBootstrap');
    expect(bootstrapSrc).toContain('loadCanonicalAdminUser');
  });

  it('does not redirect before bootstrap resolves (ready starts false)', () => {
    expect(src).toContain('useState(false)');
    expect(src).toMatch(/result\.status === 'unauthenticated'/);
    expect(src).toMatch(/setReady\(true\)/);
  });

  it('settings layout waits for ready before rendering shell', () => {
    const layout = readFileSync(join(__dirname, '../app/settings/layout.tsx'), 'utf8');
    expect(layout).toMatch(/if \(!ready \|\| !user\)/);
    const shell = readFileSync(join(__dirname, '../components/admin-authenticated-shell.tsx'), 'utf8');
    expect(shell).toMatch(/if \(!ready\) return/);
    expect(shell).toContain("router.replace('/login')");
  });

  it('uses admin-scoped refresh BFF route', () => {
    expect(bootstrapSrc).toContain('/api/auth/admin/refresh');
  });

  it('platform settings page waits for ready and uses auth token', () => {
    const page = readFileSync(join(__dirname, '../app/settings/platform/page.tsx'), 'utf8');
    expect(page).toContain('ready');
    expect(page).toContain('token');
    expect(page).not.toContain('ensureStaffAccessToken');
  });
});
