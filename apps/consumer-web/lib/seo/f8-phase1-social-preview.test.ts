import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { metadataForCanonicalBusiness } from './page-metadata';
import { metadataForCity } from './page-metadata';
import { metadataForLegalPage } from './page-metadata';
import { metadataForHelpPage } from './page-metadata';
import {
  DEFAULT_SOCIAL_PREVIEW_PATH,
  SOCIAL_PREVIEW_HEIGHT,
  SOCIAL_PREVIEW_WIDTH,
  absoluteDefaultSocialPreviewUrl,
} from './social-preview';

const ENV_KEYS = [
  'NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_CONSUMER_WEB_URL',
] as const;

const testDir = path.dirname(fileURLToPath(import.meta.url));
const assetPath = path.join(testDir, '../../public/og/qalago-default.png');

function readPngDimensions(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  expect(buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
    true,
  );
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function firstOgImageUrl(metadata: { openGraph?: { images?: unknown } }): string {
  const images = metadata.openGraph?.images;
  expect(Array.isArray(images)).toBe(true);
  const first = images?.[0];
  if (typeof first === 'string') return first;
  expect(first && typeof first === 'object' && 'url' in first).toBe(true);
  return String((first as { url: string }).url);
}

function firstTwitterImage(metadata: { twitter?: { images?: unknown } }): string {
  const images = metadata.twitter?.images;
  expect(Array.isArray(images)).toBe(true);
  return String(images?.[0]);
}

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe('F.8.1 default social preview', () => {
  it('fallback asset exists at 1200×630', () => {
    expect(fs.existsSync(assetPath)).toBe(true);
    const { width, height } = readPngDimensions(assetPath);
    expect(width).toBe(SOCIAL_PREVIEW_WIDTH);
    expect(height).toBe(SOCIAL_PREVIEW_HEIGHT);
  });

  it('absolute URL uses configured production origin', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(absoluteDefaultSocialPreviewUrl()).toBe(
      `https://qalago.kz${DEFAULT_SOCIAL_PREVIEW_PATH}`,
    );
  });

  it('city metadata — OG/Twitter image, card, canonical unchanged', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForCity('aktobe', 'Актобе', 'ru');
    const ogUrl = firstOgImageUrl(m);
    expect(ogUrl).toBe(`https://qalago.kz${DEFAULT_SOCIAL_PREVIEW_PATH}`);
    expect(m.openGraph?.images?.[0]).toMatchObject({
      width: SOCIAL_PREVIEW_WIDTH,
      height: SOCIAL_PREVIEW_HEIGHT,
    });
    expect(firstTwitterImage(m)).toBe(ogUrl);
    expect(m.twitter?.card).toBe('summary_large_image');
    expect(m.openGraph?.url).toBe('https://qalago.kz/ru/aktobe');
    expect(m.alternates?.canonical).toBe('https://qalago.kz/ru/aktobe');
  });

  it('KK city retains KK canonical with shared fallback image', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForCity('aktobe', 'Ақтөбе', 'kk');
    expect(m.alternates?.canonical).toBe('https://qalago.kz/kk/aktobe');
    expect(firstOgImageUrl(m)).toBe(`https://qalago.kz${DEFAULT_SOCIAL_PREVIEW_PATH}`);
  });

  it('legal page — locale-neutral canonical, shared fallback', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForLegalPage('privacy', 'ru');
    expect(m.alternates?.canonical).toBe('https://qalago.kz/privacy');
    expect(m.alternates?.languages).toBeUndefined();
    expect(m.openGraph?.url).toBe('https://qalago.kz/privacy');
    expect(firstOgImageUrl(m)).toContain('/og/qalago-default.png');
    expect(m.twitter?.card).toBe('summary_large_image');
  });

  it('help page — locale-neutral canonical, shared fallback', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForHelpPage('kk');
    expect(m.alternates?.canonical).toBe('https://qalago.kz/help');
    expect(m.openGraph?.url).toBe('https://qalago.kz/help');
    expect(firstTwitterImage(m)).toBe(firstOgImageUrl(m));
  });

  it('business metadata uses default fallback only (no coverImageUrl)', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForCanonicalBusiness(
      'aktobe',
      'coffee-lab',
      'Coffee Lab',
      'Desc',
      'ru',
    );
    expect(m.alternates?.canonical).toBe('https://qalago.kz/ru/aktobe/business/coffee-lab');
    expect(m.openGraph?.url).toBe('https://qalago.kz/ru/aktobe/business/coffee-lab');
    expect(m.openGraph?.url).not.toContain('locationId');
    expect(firstOgImageUrl(m)).toBe(`https://qalago.kz${DEFAULT_SOCIAL_PREVIEW_PATH}`);
  });
});
