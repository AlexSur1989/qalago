import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  consumerSponsoredLabel,
  sponsoredDisclosureLabel,
} from '@/components/ads/SponsoredLabel';
import { UI_LABELS } from '@/lib/locale';

const APP_ROOT = join(import.meta.dirname, '..');

describe('consumer sponsored disclosure (6.13M.8)', () => {
  it('RU label is Реклама', () => {
    expect(consumerSponsoredLabel('ru')).toBe('Реклама');
    expect(UI_LABELS.ru.adLabel).toBe('Реклама');
  });

  it('KK label is Жарнама', () => {
    expect(consumerSponsoredLabel('kk')).toBe('Жарнама');
    expect(UI_LABELS.kk.adLabel).toBe('Жарнама');
  });

  it('ignores backend displayLabel (owner or RU-only serve text)', () => {
    expect(sponsoredDisclosureLabel('kk', 'Реклама')).toBe('Жарнама');
    expect(sponsoredDisclosureLabel('kk', 'Продвигается')).toBe('Жарнама');
    expect(sponsoredDisclosureLabel('ru', 'VIP')).toBe('Реклама');
  });

  const placementFiles = [
    'components/ads/HomeVipBannerAd.tsx',
    'components/ads/SponsoredBusinessAdCard.tsx',
    'components/ads/HomePromotionsPaidStrip.tsx',
    'components/ads/CategorySponsoredBlock.tsx',
  ] as const;

  it.each(placementFiles)('%s renders SponsoredLabel', (rel) => {
    const src = readFileSync(join(APP_ROOT, rel), 'utf8');
    expect(src).toContain('SponsoredLabel');
  });

  it('organic home promotions preview does not use SponsoredLabel', () => {
    const src = readFileSync(
      join(APP_ROOT, 'components/home/HomePromotionsSection.tsx'),
      'utf8',
    );
    expect(src).not.toContain('SponsoredLabel');
  });

  it('organic business card does not use ad disclosure', () => {
    const src = readFileSync(
      join(APP_ROOT, 'components/home/HomeOrganicBusinessCards.tsx'),
      'utf8',
    );
    expect(src).not.toContain('SponsoredLabel');
    expect(src).not.toContain('ad-disclosure');
  });
});
