import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { legalPageUrl } from './legal-links';

describe('legal-links', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('builds privacy URL from public base', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'https://qalago.kz';
    expect(legalPageUrl('privacy')).toBe('https://qalago.kz/privacy');
  });
});
