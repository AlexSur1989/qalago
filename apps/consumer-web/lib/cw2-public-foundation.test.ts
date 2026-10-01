import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UI_LABELS } from './locale';

const APP_ROOT = join(import.meta.dirname, '..');

describe('CW.2 public UI foundation', () => {
  it('PublicShell exposes skip link, single main landmark, and mobile nav', () => {
    const src = readFileSync(join(APP_ROOT, 'components/PublicShell.tsx'), 'utf8');
    expect(src).toContain('SkipToMain');
    expect(src).toContain('MobileNav');
    expect(src).toContain('id="main-content"');
    expect(src).toContain('<main id="main-content"');
    expect(src).not.toMatch(/<main[^>]*className="page"/);
  });

  it('MobileNav uses accessible menu control semantics', () => {
    const src = readFileSync(join(APP_ROOT, 'components/public/MobileNav.tsx'), 'utf8');
    expect(src).toContain('aria-expanded');
    expect(src).toContain('aria-controls');
  });

  it('globals.css wires brand theme and consumer public styles', () => {
    const src = readFileSync(join(APP_ROOT, 'app/globals.css'), 'utf8');
    expect(src).toContain('@qalago/brand/qalago-theme.css');
    expect(src).toContain('consumer-public.css');
  });

  it('RU/KK shell strings include skip and menu labels', () => {
    for (const locale of ['ru', 'kk'] as const) {
      const labels = UI_LABELS[locale];
      expect(labels.skipToContent.length).toBeGreaterThan(3);
      expect(labels.menuOpen.length).toBeGreaterThan(1);
      expect(labels.menuClose.length).toBeGreaterThan(1);
    }
  });

  it('discovery pages use page wrapper div inside shell main', () => {
    const cityHome = readFileSync(
      join(APP_ROOT, 'app/[locale]/[citySlug]/page.tsx'),
      'utf8',
    );
    expect(cityHome).toContain('<div className="page">');
    expect(cityHome).not.toContain('<main className="page">');
  });
});
