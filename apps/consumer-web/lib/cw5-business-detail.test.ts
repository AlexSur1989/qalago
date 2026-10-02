import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canonicalBusinessPagePath } from './business-page-paths';
import {
  buildInstagramHref,
  buildTelHref,
  buildWebsiteHref,
  buildWhatsAppHref,
} from './contact-url';
import { hasWorkHours, workHoursRows } from './work-hours-display';
import { UI_LABELS } from './locale';
import { externalMapNavigationUrl } from './media-url';

const APP_ROOT = join(import.meta.dirname, '..');

describe('CW.5 business detail', () => {
  it('builds branch switch links with locationId', () => {
    expect(
      canonicalBusinessPagePath('ru', 'uralsk', 'aop7-test-cafe', 'loc-b'),
    ).toBe('/ru/uralsk/business/aop7-test-cafe?locationId=loc-b');
  });

  it('renders work hours rows for mon-sun string contract', () => {
    const raw = { mon: '09:00-18:00', sun: 'closed' };
    expect(hasWorkHours(raw)).toBe(true);
    const rows = workHoursRows(raw, 'ru');
    expect(rows).toHaveLength(7);
    expect(rows.find((r) => r.dayKey === 'mon')?.value).toContain('09:00');
    expect(rows.find((r) => r.dayKey === 'sun')?.isClosed).toBe(true);
  });

  it('handles missing work hours safely', () => {
    expect(hasWorkHours(null)).toBe(false);
    expect(workHoursRows(null, 'kk')).toEqual([]);
  });

  it('builds contact hrefs', () => {
    expect(buildTelHref('+7 711 224 1009')).toBe('tel:+77112241009');
    expect(buildWhatsAppHref('+77012241009')).toBe('https://wa.me/77012241009');
    expect(buildInstagramHref('@demo')).toBe('https://instagram.com/demo');
    expect(buildWebsiteHref('example.com')).toBe('https://example.com');
  });

  it('external map link uses coordinates', () => {
    const url = externalMapNavigationUrl(51.22, 51.39);
    expect(url).toContain('openstreetmap.org');
    expect(url).toContain('51.22');
  });

  it('BusinessShowcase has no review submission controls', () => {
    const src = readFileSync(join(APP_ROOT, 'components/BusinessShowcase.tsx'), 'utf8');
    expect(src).not.toMatch(/submit.*review|review.*submit|textarea/i);
    expect(src).not.toMatch(/ads\/serve|monetization\/ads/);
  });

  it('BusinessShowcase renders work hours section when data exists', () => {
    const src = readFileSync(join(APP_ROOT, 'components/BusinessShowcase.tsx'), 'utf8');
    expect(src).toContain('businessWorkHoursTitle');
    expect(src).toContain('workHoursRows');
  });

  it('RU/KK business detail UI labels', () => {
    for (const locale of ['ru', 'kk'] as const) {
      const l = UI_LABELS[locale];
      expect(l.businessWorkHoursTitle.length).toBeGreaterThan(2);
      expect(l.businessContactPhone.length).toBeGreaterThan(2);
      expect(l.businessOwnerReply.length).toBeGreaterThan(2);
      expect(l.businessNoRatingYet.length).toBeGreaterThan(2);
    }
  });
});
