import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('LocationMapPicker (UXA.6)', () => {
  const src = readFileSync(
    join(process.cwd(), 'components/business-location/location-map-picker.tsx'),
    'utf8',
  );

  it('exposes live coordinate readout and center tracker', () => {
    expect(src).toContain('toFixed(6)');
    expect(src).toContain('CenterTracker');
    expect(src).toContain('moveend');
  });

  it('does not use emoji map pin', () => {
    expect(src).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
});
