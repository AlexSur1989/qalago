import { normalizeKazakhstanPhone } from './auth-phone.util';

describe('normalizeKazakhstanPhone', () => {
  it('normalizes +7 format', () => {
    expect(normalizeKazakhstanPhone('+77001234567')).toBe('+77001234567');
  });

  it('normalizes 8 prefix', () => {
    expect(normalizeKazakhstanPhone('87001234567')).toBe('+77001234567');
  });

  it('normalizes 7 prefix without plus', () => {
    expect(normalizeKazakhstanPhone('77001234567')).toBe('+77001234567');
  });

  it('rejects invalid numbers', () => {
    expect(normalizeKazakhstanPhone('123')).toBeNull();
    expect(normalizeKazakhstanPhone('')).toBeNull();
  });
});
