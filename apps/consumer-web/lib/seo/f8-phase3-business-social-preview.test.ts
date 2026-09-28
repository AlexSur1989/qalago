import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveTrustedPublicBusinessCoverUrl } from './business-social-preview';
import { metadataForCanonicalBusiness } from './page-metadata';
import { metadataForCity } from './page-metadata';
import {
  DEFAULT_SOCIAL_PREVIEW_PATH,
  SOCIAL_PREVIEW_HEIGHT,
  SOCIAL_PREVIEW_WIDTH,
} from './social-preview';

const ENV_KEYS = [
  'NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_CONSUMER_WEB_URL',
  'NEXT_PUBLIC_API_URL',
] as const;

const PRODUCTION = 'https://qalago.kz';
const FALLBACK = `${PRODUCTION}${DEFAULT_SOCIAL_PREVIEW_PATH}`;

function ogImageUrl(m: { openGraph?: { images?: unknown } }): string {
  const img = m.openGraph?.images?.[0];
  if (typeof img === 'string') return img;
  return String((img as { url: string }).url);
}

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of ENV_KEYS) delete process.env[key];
});

describe('F.8.3 trusted Business cover resolver', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', PRODUCTION);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.qalago.kz/api/v1');
  });

  it('1–2. null / empty → null', () => {
    expect(resolveTrustedPublicBusinessCoverUrl(null)).toBeNull();
    expect(resolveTrustedPublicBusinessCoverUrl('')).toBeNull();
    expect(resolveTrustedPublicBusinessCoverUrl('   ')).toBeNull();
  });

  it('3. trusted relative /uploads → Consumer Web absolute', () => {
    expect(resolveTrustedPublicBusinessCoverUrl('/uploads/cafe-cover.webp')).toBe(
      `${PRODUCTION}/uploads/cafe-cover.webp`,
    );
  });

  it('4. trusted absolute on configured API origin → Consumer Web /uploads path', () => {
    expect(
      resolveTrustedPublicBusinessCoverUrl('https://api.qalago.kz/uploads/photo.webp'),
    ).toBe(`${PRODUCTION}/uploads/photo.webp`);
  });

  it('5–6. arbitrary external http(s) → null', () => {
    expect(resolveTrustedPublicBusinessCoverUrl('https://evil.example/image.jpg')).toBeNull();
    expect(resolveTrustedPublicBusinessCoverUrl('http://evil.example/image.jpg')).toBeNull();
  });

  it('7–8. javascript: and data: → null', () => {
    expect(resolveTrustedPublicBusinessCoverUrl('javascript:alert(1)')).toBeNull();
    expect(resolveTrustedPublicBusinessCoverUrl('data:image/png;base64,abc')).toBeNull();
  });

  it('9. malformed URL → null', () => {
    expect(resolveTrustedPublicBusinessCoverUrl('not-a-url')).toBeNull();
    expect(resolveTrustedPublicBusinessCoverUrl('https://')).toBeNull();
  });

  it('10. unsafe relative path → null', () => {
    expect(resolveTrustedPublicBusinessCoverUrl('/uploads/../etc/passwd')).toBeNull();
    expect(resolveTrustedPublicBusinessCoverUrl('/media/x.webp')).toBeNull();
    expect(resolveTrustedPublicBusinessCoverUrl('uploads/x.webp')).toBeNull();
  });
});

describe('F.8.3 Business page metadata', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', PRODUCTION);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3002/api/v1');
  });

  it('11–12. OG and Twitter share same Business or fallback image', () => {
    const trusted = '/uploads/brand.webp';
    const m = metadataForCanonicalBusiness(
      'uralsk',
      'brand',
      'Brand',
      'Desc',
      'ru',
      trusted,
    );
    const og = ogImageUrl(m);
    expect(m.twitter?.images?.[0]).toBe(og);
    expect(og).toBe(`${PRODUCTION}/uploads/brand.webp`);
  });

  it('untrusted cover → fallback OG/Twitter match', () => {
    const m = metadataForCanonicalBusiness(
      'uralsk',
      'brand',
      'Brand',
      'Desc',
      'ru',
      'https://evil.example/x.jpg',
    );
    const og = ogImageUrl(m);
    expect(og).toBe(FALLBACK);
    expect(m.twitter?.images?.[0]).toBe(FALLBACK);
  });

  it('13–14. locationId not in metadata API — same cover regardless of branch context param', () => {
    const withCover = metadataForCanonicalBusiness(
      'aktobe',
      'x',
      'X',
      null,
      'ru',
      '/uploads/a.webp',
    );
    const again = metadataForCanonicalBusiness('aktobe', 'x', 'X', null, 'ru', '/uploads/a.webp');
    expect(withCover).toEqual(again);
    expect(withCover.openGraph?.url).not.toContain('locationId');
    expect(withCover.alternates?.canonical).toBe(`${PRODUCTION}/ru/aktobe/business/x`);
  });

  it('15–16. RU and KK canonical preserved', () => {
    const ru = metadataForCanonicalBusiness('uralsk', 'b', 'B', null, 'ru', null);
    const kk = metadataForCanonicalBusiness('uralsk', 'b', 'B', null, 'kk', null);
    expect(ru.alternates?.canonical).toBe(`${PRODUCTION}/ru/uralsk/business/b`);
    expect(kk.alternates?.canonical).toBe(`${PRODUCTION}/kk/uralsk/business/b`);
    expect(ogImageUrl(ru)).toBe(FALLBACK);
  });

  it('17. effectiveMedia not used — branch-only cover in effectiveMedia ignored at metadata layer', () => {
    const m = metadataForCanonicalBusiness(
      'uralsk',
      'b',
      'B',
      null,
      'ru',
      null,
    );
    expect(ogImageUrl(m)).toBe(FALLBACK);
  });

  it('18. non-Business route still uses fallback dimensions', () => {
    const city = metadataForCity('uralsk', 'U', 'ru');
    expect(city.openGraph?.images?.[0]).toMatchObject({
      width: SOCIAL_PREVIEW_WIDTH,
      height: SOCIAL_PREVIEW_HEIGHT,
    });
  });

  it('19–20. fallback has 1200×630; Business upload has no fabricated dimensions', () => {
    const fb = metadataForCanonicalBusiness('uralsk', 'b', 'B', null, 'ru', null);
    expect(fb.openGraph?.images?.[0]).toMatchObject({
      width: SOCIAL_PREVIEW_WIDTH,
      height: SOCIAL_PREVIEW_HEIGHT,
    });
    const biz = metadataForCanonicalBusiness(
      'uralsk',
      'b',
      'B',
      null,
      'ru',
      '/uploads/c.webp',
    );
    const entry = biz.openGraph?.images?.[0];
    expect(entry && typeof entry === 'object' && 'width' in entry ? entry.width : undefined).toBe(
      undefined,
    );
    expect(entry && typeof entry === 'object' && 'height' in entry ? entry.height : undefined).toBe(
      undefined,
    );
  });

  it('twitter.card remains summary_large_image', () => {
    const m = metadataForCanonicalBusiness('uralsk', 'b', 'B', null, 'ru', '/uploads/x.webp');
    expect(m.twitter?.card).toBe('summary_large_image');
  });
});
