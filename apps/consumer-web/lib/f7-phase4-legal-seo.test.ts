import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '../app/robots';
import {
  LEGAL_BODY_SOURCE_LOCALE,
  LEGAL_UI,
  legalPageHeading,
  legalPageMetadataCopy,
} from './legal-ui';
import { PUBLIC_LEGAL_ROOT_SEGMENTS } from './legal-paths';
import { canonicalForLegalPage } from './seo/canonical';
import { metadataForLegalPage } from './seo/page-metadata';
import {
  buildDiscoverySitemapEntries,
  buildLegalSitemapEntries,
  mergeDiscoveryAndLegalSitemapEntries,
} from './seo/sitemap-builder';
import { metadataForCity } from './seo/page-metadata';
import {
  resolveMiddlewareLocaleRedirect,
} from './middleware-public-locale-redirect';

const ENV_KEYS = [
  'NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_CONSUMER_WEB_URL',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe('F.7 Phase 4 legal SEO and localization', () => {
  it('canonical URLs are locale-neutral for all legal roots', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(canonicalForLegalPage('privacy')).toBe('https://qalago.kz/privacy');
    expect(canonicalForLegalPage('terms')).toBe('https://qalago.kz/terms');
    expect(canonicalForLegalPage('account-deletion')).toBe(
      'https://qalago.kz/account-deletion',
    );
  });

  it('does not emit hreflang alternates on legal metadata', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    for (const page of PUBLIC_LEGAL_ROOT_SEGMENTS) {
      const m = metadataForLegalPage(page, 'ru');
      expect(m.alternates?.canonical).toBe(canonicalForLegalPage(page));
      expect(m.alternates?.languages).toBeUndefined();
    }
  });

  it('legal metadata is indexable', () => {
    const m = metadataForLegalPage('privacy', 'ru');
    expect(m.robots).toEqual({ index: true, follow: true });
  });

  it('RU vs KK chrome differs; body source locale stays Russian', () => {
    expect(legalPageHeading('ru', 'privacy')).toBe('Политика конфиденциальности');
    expect(legalPageHeading('kk', 'privacy')).toBe('Құпиялылық саясаты');
    expect(LEGAL_BODY_SOURCE_LOCALE).toBe('ru');
    const privacyPage = readFileSync(
      join(process.cwd(), 'app/privacy/page.tsx'),
      'utf8',
    );
    expect(privacyPage).toContain('LegalPackPage');
    expect(privacyPage).toContain('packKey="privacy-policy"');
    const packPage = readFileSync(
      join(process.cwd(), 'components/LegalPackPage.tsx'),
      'utf8',
    );
    expect(packPage).not.toMatch(/machineTranslate|i18n\.t\(/);
  });

  it('sitemap includes each legal URL once without locale prefix', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const legal = buildLegalSitemapEntries();
    expect(legal.map((e) => e.url)).toEqual(
      PUBLIC_LEGAL_ROOT_SEGMENTS.map(
        (segment) => `https://qalago.kz/${segment}`,
      ),
    );
    const merged = mergeDiscoveryAndLegalSitemapEntries(
      buildDiscoverySitemapEntries({
        cities: [{ id: 'c1', slug: 'aktobe', nameRu: 'Актобе', nameKk: 'Ақтөбе' }],
        categoriesByCitySlug: { aktobe: [] },
        subcategoriesByCategoryId: {},
      }),
    );
    const urls = merged.map((e) => e.url);
    expect(urls.filter((u) => u.endsWith('/privacy'))).toHaveLength(1);
    expect(urls.some((u) => u.includes('/ru/privacy'))).toBe(false);
    expect(urls.some((u) => u.includes('/kk/privacy'))).toBe(false);
    expect(urls).toContain('https://qalago.kz/ru/aktobe');
    expect(urls).toContain('https://qalago.kz/help');
    expect(urls.filter((u) => u.endsWith('/help'))).toHaveLength(1);
  });

  it('robots allows legal roots (not disallowed)', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules?.disallow).not.toContain('/privacy');
    expect(rules?.allow).toBe('/');
  });

  it('F.5 discovery hreflang unchanged on city pages', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForCity('aktobe', 'Актобе', 'ru');
    expect(m.alternates?.languages?.kk).toBe('https://qalago.kz/kk/aktobe');
  });

  it('middleware keeps legal roots locale-neutral', () => {
    for (const path of ['/privacy', '/terms', '/account-deletion'] as const) {
      const d = resolveMiddlewareLocaleRedirect(path, new URLSearchParams(), null);
      expect(d.kind).toBe('none');
    }
  });

  it('KK metadata title uses centralized LEGAL_UI', () => {
    const { title } = legalPageMetadataCopy('kk', 'terms');
    expect(title).toBe(LEGAL_UI.kk.termsPageTitle);
  });

  it('dev canonical uses consumer web origin not hardcoded qalago.kz', () => {
    delete process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_CONSUMER_WEB_URL = 'http://localhost:3005';
    expect(canonicalForLegalPage('privacy')).toBe('http://localhost:3005/privacy');
  });
});

describe('F.7 Phase 3 Business Web redirect regression (read-only)', () => {
  it('business-web privacy page still permanentRedirects to consumer origin', () => {
    const root = join(process.cwd(), '..', 'business-web', 'app', 'privacy', 'page.tsx');
    const src = readFileSync(root, 'utf8');
    expect(src).toContain('permanentRedirect');
    expect(src).toContain("consumerWebLegalUrl('/privacy')");
  });
});
