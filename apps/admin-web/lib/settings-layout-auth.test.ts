import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('settings layout auth guard (BIZ.9 HOTFIX 6)', () => {
  const layout = readFileSync(join(__dirname, '../app/settings/layout.tsx'), 'utf8');

  it('shows loading shell while bootstrap pending', () => {
    expect(layout).toContain('Загрузка');
    expect(layout).toMatch(/if \(!ready \|\| !user\)/);
  });

  it('redirects to login only after ready', () => {
    expect(layout).toMatch(/if \(!ready\) return/);
    expect(layout).toContain("router.replace('/login')");
  });
});
