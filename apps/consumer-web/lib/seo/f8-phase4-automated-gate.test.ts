/**
 * F.8.4 — automated social preview regression gate (§ F.8.17 acceptance mapping).
 * External crawler QA remains F.8.5 / EXTERNAL-PENDING.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveTrustedPublicBusinessCoverUrl } from './business-social-preview';
import {
  metadataForCanonicalBusiness,
  metadataForCategory,
  metadataForCity,
  metadataForCityCategories,
  metadataForHelpPage,
  metadataForLegalPage,
  metadataForSearch,
  metadataForSubcategory,
  metadataForTemporaryBusinessDetail,
  rootSiteMetadata,
} from './page-metadata';
import {
  DEFAULT_SOCIAL_PREVIEW_PATH,
  SOCIAL_PREVIEW_HEIGHT,
  SOCIAL_PREVIEW_WIDTH,
  absoluteDefaultSocialPreviewUrl,
} from './social-preview';
import { siteMetadataForLocale } from '@/lib/locale';

const ENV_KEYS = [
  'NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_CONSUMER_WEB_URL',
  'NEXT_PUBLIC_API_URL',
] as const;

const PRODUCTION = 'https://qalago.kz';
const FALLBACK = `${PRODUCTION}${DEFAULT_SOCIAL_PREVIEW_PATH}`;
const seoDir = path.dirname(fileURLToPath(import.meta.url));
const defaultAssetPath = path.join(seoDir, '../../public/og/qalago-default.png');
const regenScriptPath = path.join(seoDir, '../../tool/generate-default-og.ps1');

function pngSize(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function ogUrl(m: { openGraph?: { images?: unknown } }): string {
  const img = m.openGraph?.images?.[0];
  if (typeof img === 'string') return img;
  return String((img as { url: string }).url);
}

function twUrl(m: { twitter?: { images?: unknown } }): string {
  return String(m.twitter?.images?.[0]);
}

function assertParticipatingSocial(m: {
  openGraph?: { images?: unknown; url?: string };
  twitter?: { card?: string; images?: unknown };
  alternates?: { canonical?: string };
}): void {
  expect(m.openGraph?.images?.length).toBeGreaterThan(0);
  expect(m.twitter?.images?.length).toBeGreaterThan(0);
  expect(m.twitter?.card).toBe('summary_large_image');
  expect(twUrl(m)).toBe(ogUrl(m));
  if (m.openGraph?.url && m.alternates?.canonical) {
    expect(m.openGraph.url).toBe(m.alternates.canonical);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of ENV_KEYS) delete process.env[key];
});

describe('F.8.4 default fallback asset', () => {
  it('asset exists at stable public path with 1200×630', () => {
    expect(fs.existsSync(defaultAssetPath)).toBe(true);
    expect(fs.existsSync(regenScriptPath)).toBe(true);
    const { width, height } = pngSize(defaultAssetPath);
    expect(width).toBe(1200);
    expect(height).toBe(630);
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', PRODUCTION);
    expect(absoluteDefaultSocialPreviewUrl()).toBe(FALLBACK);
  });
});

describe('F.8.4 extended trusted-media matrix', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', PRODUCTION);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.qalago.kz/api/v1');
  });

  const reject = (raw: string | null | undefined) =>
    expect(resolveTrustedPublicBusinessCoverUrl(raw)).toBeNull();

  it('rejects null, empty, whitespace, undefined', () => {
    reject(null);
    reject(undefined);
    reject('');
    reject('   ');
  });

  it('accepts valid relative and nested /uploads paths', () => {
    expect(resolveTrustedPublicBusinessCoverUrl('/uploads/a.jpg')).toBe(
      `${PRODUCTION}/uploads/a.jpg`,
    );
    expect(resolveTrustedPublicBusinessCoverUrl('/uploads/nested/a.webp')).toBe(
      `${PRODUCTION}/uploads/nested/a.webp`,
    );
  });

  it('rejects traversal, backslash, non-uploads, protocol-relative shapes', () => {
    reject('/uploads/../secret');
    reject('/uploads/foo\\bar');
    reject('/media/x.webp');
    reject('//evil.example/uploads/x.webp');
    reject('/uploads//double');
  });

  it('rejects encoded traversal after decode', () => {
    reject('/uploads/%2e%2e/secret.webp');
  });

  it('rejects arbitrary external and dangerous schemes', () => {
    reject('http://evil.example/uploads/x.jpg');
    reject('https://evil.example/uploads/x.jpg');
    reject('javascript:alert(1)');
    reject('data:image/png;base64,abc');
    reject('file:///uploads/x.webp');
    reject('ftp://api.qalago.kz/uploads/x.webp');
  });

  it('rejects lookalike hostnames', () => {
    reject('https://qalago.kz.evil.example/uploads/x.webp');
    reject('https://api.qalago.kz.evil.example/uploads/x.webp');
  });

  it('accepts trusted API absolute; rejects trusted origin wrong path', () => {
    expect(resolveTrustedPublicBusinessCoverUrl('https://api.qalago.kz/uploads/p.webp')).toBe(
      `${PRODUCTION}/uploads/p.webp`,
    );
    reject('https://api.qalago.kz/static/p.webp');
    reject('https://qalago.kz/privacy');
  });

  it('accepts Consumer Web absolute /uploads on configured origin', () => {
    expect(resolveTrustedPublicBusinessCoverUrl(`${PRODUCTION}/uploads/x.webp`)).toBe(
      `${PRODUCTION}/uploads/x.webp`,
    );
  });
});

describe('F.8.4 route matrix — social preview participation', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', PRODUCTION);
  });

  it('indexable discovery + legal/help + search(noindex)', () => {
    const ruCity = metadataForCity('uralsk', 'U', 'ru');
    const kkCity = metadataForCity('uralsk', 'O', 'kk');
    assertParticipatingSocial(ruCity);
    assertParticipatingSocial(kkCity);
    expect(ruCity.alternates?.canonical).toBe(`${PRODUCTION}/ru/uralsk`);
    expect(kkCity.alternates?.canonical).toBe(`${PRODUCTION}/kk/uralsk`);
    expect(ogUrl(ruCity)).toBe(FALLBACK);

    assertParticipatingSocial(metadataForCityCategories('uralsk', 'U', 'ru'));
    assertParticipatingSocial(metadataForCityCategories('uralsk', 'O', 'kk'));
    assertParticipatingSocial(
      metadataForCategory('uralsk', 'U', 'food', 'Food', 'ru', 1),
    );
    assertParticipatingSocial(
      metadataForCategory('uralsk', 'O', 'food', 'Food', 'kk', 1),
    );
    assertParticipatingSocial(
      metadataForSubcategory('uralsk', 'U', 'food', 'F', 'cafes', 'C', 'ru', 1),
    );
    assertParticipatingSocial(
      metadataForSubcategory('uralsk', 'O', 'food', 'F', 'cafes', 'C', 'kk', 1),
    );

    for (const page of ['privacy', 'terms', 'account-deletion'] as const) {
      const m = metadataForLegalPage(page, 'ru');
      assertParticipatingSocial(m);
      expect(m.alternates?.canonical).toBe(`${PRODUCTION}/${page}`);
      expect(m.alternates?.languages).toBeUndefined();
    }
    const help = metadataForHelpPage('kk');
    assertParticipatingSocial(help);
    expect(help.alternates?.canonical).toBe(`${PRODUCTION}/help`);

    const search = metadataForSearch('uralsk', 'U', 'ru', 'q');
    assertParticipatingSocial(search);
    expect(search.robots).toEqual({ index: false, follow: true });

    const { title, description } = siteMetadataForLocale('ru');
    assertParticipatingSocial(rootSiteMetadata('ru', title, description));
  });

  it('Business trusted cover vs fallback; locationId not in OG URL', () => {
    const trusted = metadataForCanonicalBusiness(
      'uralsk',
      'b',
      'B',
      null,
      'ru',
      '/uploads/c.webp',
    );
    assertParticipatingSocial(trusted);
    expect(ogUrl(trusted)).toBe(`${PRODUCTION}/uploads/c.webp`);
    expect(trusted.openGraph?.url).toBe(`${PRODUCTION}/ru/uralsk/business/b`);
    expect(trusted.openGraph?.url).not.toContain('locationId');

    const fb = metadataForCanonicalBusiness(
      'uralsk',
      'b',
      'B',
      null,
      'ru',
      'https://evil.example/x.jpg',
    );
    assertParticipatingSocial(fb);
    expect(ogUrl(fb)).toBe(FALLBACK);
    expect(fb.openGraph?.images?.[0]).toMatchObject({
      width: SOCIAL_PREVIEW_WIDTH,
      height: SOCIAL_PREVIEW_HEIGHT,
    });
  });

  it('legacy business — no independent social identity', () => {
    const legacy = metadataForTemporaryBusinessDetail('Legacy');
    expect(legacy.openGraph?.images).toBeUndefined();
    expect(legacy.robots).toEqual({ index: false, follow: true });
  });

  it('redirect routes — no generateMetadata in support/categories compat', () => {
    for (const rel of ['support/page.tsx', 'categories/page.tsx', 'categories/[id]/page.tsx']) {
      const src = fs.readFileSync(path.join(seoDir, '../../app', rel), 'utf8');
      expect(src).toMatch(/permanentRedirect/);
      expect(src).not.toMatch(/generateMetadata/);
    }
  });
});

describe('F.8.4 failure safety — metadata helpers do not throw', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', PRODUCTION);
  });

  it('Business metadata tolerates hostile cover strings', () => {
    expect(() =>
      metadataForCanonicalBusiness('uralsk', 'b', 'B', null, 'ru', 'javascript:x'),
    ).not.toThrow();
    const m = metadataForCanonicalBusiness('uralsk', 'b', 'B', null, 'ru', 'javascript:x');
    expect(ogUrl(m)).toBe(FALLBACK);
  });
});

describe('F.8.4 SSRF static audit — F.8 SEO modules', () => {
  const f8Sources = [
    'business-social-preview.ts',
    'social-preview.ts',
    'page-metadata.ts',
  ];

  it('no fetch/axios/ImageResponse/network request usage', () => {
    for (const file of f8Sources) {
      const src = fs.readFileSync(path.join(seoDir, file), 'utf8');
      expect(src).not.toMatch(/\bfetch\s*\(/);
      expect(src).not.toMatch(/\baxios\b/);
      expect(src).not.toMatch(/\bImageResponse\b/);
      expect(src).not.toMatch(/\bhttp\.request\b/);
      expect(src).not.toMatch(/\bhttps\.request\b/);
    }
  });
});

describe('F.8.17 acceptance criteria (automated subset)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', PRODUCTION);
  });

  it('criteria 1–3,6,9–12 represented by participating route + trust tests', () => {
    const m = metadataForCity('uralsk', 'U', 'ru');
    assertParticipatingSocial(m);
    expect(m.openGraph?.url).toBe(m.alternates?.canonical);
    expect(resolveTrustedPublicBusinessCoverUrl('https://evil.example/x')).toBeNull();
  });

  it('criterion 4 — fallback metadata declares 1200×630', () => {
    const m = metadataForCity('uralsk', 'U', 'ru');
    expect(m.openGraph?.images?.[0]).toMatchObject({
      width: SOCIAL_PREVIEW_WIDTH,
      height: SOCIAL_PREVIEW_HEIGHT,
    });
  });

  it('criterion 5 — production-shaped absolute fallback URL', () => {
    expect(absoluteDefaultSocialPreviewUrl()).toBe(FALLBACK);
  });

  it('criteria 7–8 — RU/KK canonical; legal neutral', () => {
    expect(metadataForCity('u', 'U', 'kk').alternates?.canonical).toContain('/kk/');
    expect(metadataForLegalPage('privacy', 'ru').alternates?.canonical).toBe(
      `${PRODUCTION}/privacy`,
    );
  });

  it('criterion 10 — metadata API has no locationId parameter on Business OG', () => {
    const src = fs.readFileSync(
      path.join(seoDir, '../../app/[locale]/[citySlug]/business/[businessSlug]/page.tsx'),
      'utf8',
    );
    expect(src).toMatch(/coverImageUrl/);
    expect(src).not.toMatch(/effectiveMedia.*metadataForCanonicalBusiness/s);
  });
});
