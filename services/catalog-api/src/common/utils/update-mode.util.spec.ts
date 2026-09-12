import { UpdateMode } from '@qalago/shared-types';
import { resolveUpdateMode } from './update-mode.util';

describe('update-mode.util', () => {
  const base = {
    minimumVersion: '1.0.0',
    latestVersion: '1.1.0',
    minimumBuild: null as number | null,
    latestBuild: null as number | null,
  };

  it('F: installed >= latest → NONE', () => {
    expect(
      resolveUpdateMode({ ...base, appVersion: '1.1.0', buildNumber: 1 }),
    ).toBe(UpdateMode.NONE);
  });

  it('G: minimum <= installed < latest → OPTIONAL', () => {
    expect(
      resolveUpdateMode({ ...base, appVersion: '1.0.5', buildNumber: 1 }),
    ).toBe(UpdateMode.OPTIONAL);
  });

  it('H: installed < minimum → REQUIRED', () => {
    expect(
      resolveUpdateMode({ ...base, appVersion: '0.9.9', buildNumber: 1 }),
    ).toBe(UpdateMode.REQUIRED);
  });

  it('I: build number required when below minimum build', () => {
    expect(
      resolveUpdateMode({
        ...base,
        appVersion: '1.0.0',
        buildNumber: 5,
        minimumBuild: 10,
        latestBuild: 20,
      }),
    ).toBe(UpdateMode.REQUIRED);
  });
});
