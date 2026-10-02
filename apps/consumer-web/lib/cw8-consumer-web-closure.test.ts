import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDiscoverySitemapEntries } from './seo/sitemap-builder';

const REPO_ROOT = join(import.meta.dirname, '../../..');

describe('CW.8 Consumer Web closure gates', () => {
  it('CI workflow runs consumer-web test, UI checker, and build', () => {
    const ci = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
    expect(ci).toContain('consumer-web:');
    expect(ci).toMatch(/npm run test -w @qalago\/consumer-web/);
    expect(ci).toMatch(/check:ui-strings -w @qalago\/consumer-web/);
    expect(ci).toMatch(/npm run build -w @qalago\/consumer-web/);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sitemap includes indexable city promotions routes for RU and KK', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const entries = buildDiscoverySitemapEntries({
      cities: [
        { id: 'c1', slug: 'uralsk', nameRu: 'Уральск', nameKk: 'Орал' },
        { id: 'c2', slug: 'aktobe', nameRu: 'Актобе', nameKk: 'Ақтөбе' },
      ],
      categoriesByCitySlug: {},
      subcategoriesByCategoryId: {},
    });
    const urls = entries.map((e) => e.url);
    for (const city of ['uralsk', 'aktobe']) {
      expect(urls).toContain(`https://qalago.kz/ru/${city}/promotions`);
      expect(urls).toContain(`https://qalago.kz/kk/${city}/promotions`);
    }
    expect(urls.filter((u) => u.includes('/promotions')).length).toBe(4);
    expect(urls.some((u) => u.includes('/search'))).toBe(false);
  });
});
