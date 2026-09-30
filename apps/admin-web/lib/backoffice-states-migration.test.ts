import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd());

const MIGRATED = [
  'components/admin-authenticated-shell.tsx',
  'app/audit-logs/page.tsx',
  'app/staff/page.tsx',
  'app/settings/platform/page.tsx',
  'app/catalog/businesses/page.tsx',
  'components/reports/ReportStates.tsx',
];

describe('admin backoffice states migration (UXA.9)', () => {
  it('representative surfaces import @qalago/brand/states', () => {
    for (const rel of MIGRATED) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src.includes('@qalago/brand/states'), rel).toBe(true);
    }
  });

  it('ReportStates wires canonical error and access denied', () => {
    const src = readFileSync(join(ROOT, 'components/reports/ReportStates.tsx'), 'utf8');
    expect(src).toContain('BackofficeErrorState');
    expect(src).toContain('BackofficeAccessDenied');
  });
});
