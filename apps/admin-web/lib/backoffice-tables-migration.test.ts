import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd());

function read(rel: string) {
  return readFileSync(join(root, rel), 'utf8');
}

describe('UXA.4 table migrations (admin-web)', () => {
  it('priority list pages import @qalago/brand/tables', () => {
    const paths = [
      'app/catalog/businesses/page.tsx',
      'app/audit-logs/page.tsx',
      'app/staff/page.tsx',
      'app/business-requests/applications/page.tsx',
      'app/business-requests/claims/page.tsx',
      'app/moderation/cases/page.tsx',
      'app/monetization/campaigns/page.tsx',
    ];
    for (const p of paths) {
      expect(read(p)).toContain('@qalago/brand/tables');
    }
  });

  it('applications table uses badges not raw status spans', () => {
    const src = read('app/business-requests/applications/page.tsx');
    expect(src).toContain('BackofficeBadge');
    expect(src).not.toContain('applicationStatusClass');
  });
});
