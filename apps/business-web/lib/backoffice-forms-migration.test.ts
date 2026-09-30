import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd());

function read(rel: string) {
  return readFileSync(join(root, rel), 'utf8');
}

describe('UXA.5 form migrations (business-web)', () => {
  it('priority form pages import @qalago/brand/forms', () => {
    const paths = [
      'app/settings/page.tsx',
      'app/business/[id]/page.tsx',
      'app/business/[id]/locations/page.tsx',
      'app/business/[id]/promotions/page.tsx',
      'app/business/[id]/menu/page.tsx',
      'components/business-location/business-location-field.tsx',
    ];
    for (const p of paths) {
      expect(read(p)).toContain('@qalago/brand/forms');
    }
  });

  it('settings page uses dirty guard hooks', () => {
    const src = read('app/settings/page.tsx');
    expect(src).toContain('useFormDirty');
    expect(src).toContain('useUnsavedChangesGuard');
  });
});
