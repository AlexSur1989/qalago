import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd());

function read(rel: string) {
  return readFileSync(join(root, rel), 'utf8');
}

describe('UXA.5 form migrations (admin-web)', () => {
  it('priority form pages import @qalago/brand/forms', () => {
    const paths = [
      'app/catalog/businesses/new/page.tsx',
      'app/catalog/businesses/[id]/page.tsx',
      'components/settings/platform-feature-row.tsx',
      'components/staff-mfa-enrollment.tsx',
    ];
    for (const p of paths) {
      expect(read(p)).toContain('@qalago/brand/forms');
    }
  });

  it('platform feature row uses BackofficeSwitch', () => {
    const src = read('components/settings/platform-feature-row.tsx');
    expect(src).toContain('BackofficeSwitch');
    expect(src).not.toMatch(/type=["']checkbox["']/);
  });

  it('catalog create uses BackofficeField not bare label wrappers', () => {
    const src = read('app/catalog/businesses/new/page.tsx');
    expect(src).toContain('BackofficeField');
    expect(src).not.toMatch(/<label>\s*\n\s*\{adminCatalogLabel/);
  });
});
