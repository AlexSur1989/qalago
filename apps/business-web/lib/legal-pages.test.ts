import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { consumerWebLegalUrl } from './consumer-web-legal-redirect';
import { getConsumerWebOrigin } from './consumer-web-origin';

const root = join(process.cwd(), 'app');

function readPage(relative: string): string {
  return readFileSync(join(root, relative), 'utf8');
}

describe('F.7 Phase 3 legacy legal redirects', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  for (const [segment, file] of [
    ['privacy', 'privacy/page.tsx'],
    ['terms', 'terms/page.tsx'],
    ['account-deletion', 'account-deletion/page.tsx'],
  ] as const) {
    it(`${segment} page uses permanentRedirect to consumer web`, () => {
      const src = readPage(file);
      expect(src).toContain('permanentRedirect');
      expect(src).toContain(`consumerWebLegalUrl('/${segment}')`);
      expect(src).not.toContain('LEGAL_PLACEHOLDERS');
    });
  }

  it('redirect target uses configured consumer web origin in dev', () => {
    process.env.NEXT_PUBLIC_CONSUMER_WEB_URL = 'http://localhost:3005';
    delete process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL;
    expect(getConsumerWebOrigin()).toBe('http://localhost:3005');
    expect(consumerWebLegalUrl('/privacy')).toBe('http://localhost:3005/privacy');
  });

  it('redirect target uses public base when set (production)', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'https://qalago.kz';
    expect(consumerWebLegalUrl('/terms')).toBe('https://qalago.kz/terms');
  });

  it('does not introduce locale-prefixed legal targets', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'https://qalago.kz';
    expect(consumerWebLegalUrl('/privacy')).not.toContain('/ru/');
    expect(consumerWebLegalUrl('/privacy')).not.toContain('/kk/');
  });

  it('rejects invalid redirect path injection', () => {
    expect(() => consumerWebLegalUrl('/help' as '/privacy')).toThrow();
  });
});

describe('help route unchanged', () => {
  it('help page is not a legal redirect stub', () => {
    const src = readFileSync(join(root, 'help/page.tsx'), 'utf8');
    expect(src).not.toContain('permanentRedirect');
    expect(src).not.toContain('consumerWebLegalUrl');
  });
});
