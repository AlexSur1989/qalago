import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd());

function read(rel: string) {
  return readFileSync(join(root, rel), 'utf8');
}

describe('UXA.6 location UX (business-web)', () => {
  it('locations page uses branch card and UXA.7 confirm for set-primary', () => {
    const src = read('app/business/[id]/locations/page.tsx');
    expect(src).toContain('@qalago/brand/locations');
    expect(src).toContain('BackofficeBranchCard');
    expect(src).toContain('backofficeConfirm');
    expect(src).toContain('setPrimaryConfirmTitle');
  });

  it('map picker uses QalaIcon not emoji pin', () => {
    const src = read('components/business-location/location-map-picker.tsx');
    expect(src).toContain('QalaIcon');
    expect(src).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
});
