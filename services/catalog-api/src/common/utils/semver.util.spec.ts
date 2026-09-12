import { compareSemVer, parseSemVer } from './semver.util';

describe('semver.util', () => {
  it('A: equality', () => {
    expect(compareSemVer('1.0.0', '1.0.0')).toBe(0);
  });

  it('B: patch newer', () => {
    expect(compareSemVer('1.0.1', '1.0.0')).toBe(1);
  });

  it('C: minor newer', () => {
    expect(compareSemVer('1.1.0', '1.0.9')).toBe(1);
  });

  it('D: major newer', () => {
    expect(compareSemVer('2.0.0', '1.9.9')).toBe(1);
  });

  it('E: malformed rejected', () => {
    expect(() => parseSemVer('1.0')).toThrow();
    expect(() => parseSemVer('v1.0.0')).toThrow();
  });
});
