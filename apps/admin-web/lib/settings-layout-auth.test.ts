import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('settings layout auth guard (BIZ.9 HOTFIX 6)', () => {
  const layout = readFileSync(join(__dirname, '../app/settings/layout.tsx'), 'utf8');

  it('shows loading shell while bootstrap pending', () => {
    expect(layout).toContain('Загрузка');
    expect(layout).toMatch(/if \(!ready \|\| !user\)/);
  });

  it('delegates login redirect to AdminAuthenticatedShell after ready', () => {
    expect(layout).toContain('AdminAuthenticatedShell');
    expect(layout).toMatch(/if \(!ready \|\| !user\)/);
    const shell = readFileSync(join(__dirname, '../components/admin-authenticated-shell.tsx'), 'utf8');
    expect(shell).toMatch(/if \(!ready\) return/);
    expect(shell).toContain("router.replace('/login')");
  });
});
