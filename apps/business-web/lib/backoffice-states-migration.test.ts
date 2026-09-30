import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd());

describe('business backoffice states migration (UXA.9)', () => {
  it('access denied and feature unavailable use shared states', () => {
    const denied = readFileSync(join(ROOT, 'components/business-section-access-denied.tsx'), 'utf8');
    const feature = readFileSync(
      join(ROOT, 'components/business-platform-feature-unavailable.tsx'),
      'utf8',
    );
    expect(denied).toContain('BackofficeAccessDenied');
    expect(feature).toContain('BackofficeFeatureUnavailable');
    expect(denied).not.toContain('BackofficeFeatureUnavailable');
    expect(feature).not.toContain('BackofficeAccessDenied');
  });

  it('representative pages import canonical state components', () => {
    for (const rel of [
      'app/dashboard/page.tsx',
      'app/messages/page.tsx',
      'app/settings/page.tsx',
      'app/business/[id]/media/page.tsx',
      'app/business/[id]/menu/page.tsx',
    ]) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src.includes('@qalago/brand/states'), rel).toBe(true);
    }
  });
});
