import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('business content inspection page (A.7.8.6)', () => {
  const pagePath = join(
    __dirname,
    '../app/dashboard/businesses/[id]/content/page.tsx',
  );
  const src = readFileSync(pagePath, 'utf8');

  it('is read-only — no branch editor or mutation controls', () => {
    expect(src).not.toContain('branchAvailability');
    expect(src).not.toContain('PATCH');
    expect(src).not.toContain('DELETE');
    expect(src).not.toContain('POST');
    expect(src).not.toMatch(/<select[^>]*branch/i);
  });

  it('renders catalog and promotions sections', () => {
    expect(src).toContain('Товары и услуги');
    expect(src).toContain('Тауарлар мен қызметтер');
    expect(src).toContain('Акции / Акциялар');
  });

  it('uses staff branch scope labels', () => {
    expect(src).toContain('formatStaffBranchScopeSummary');
    expect(src).toContain('staffBranchContentLabel');
  });
});
