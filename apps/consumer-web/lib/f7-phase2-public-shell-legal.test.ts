import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { legalPageUrl } from './legal-links';

const APP_ROOT = join(import.meta.dirname, '..');

describe('F.7 Phase 2 PublicShell legal same-origin', () => {
  it('PublicShell uses Link for migrated legal routes', () => {
    const src = readFileSync(join(APP_ROOT, 'components/PublicShell.tsx'), 'utf8');
    expect(src).toContain('legalPageUrl(key)');
    expect(src).toContain('<Link key={key} href={href}');
    expect(src).toContain("'help'");
    expect(src).not.toContain('rel="noopener noreferrer"');
  });

  it('legal routes remain available from Phase 1', () => {
    expect(legalPageUrl('privacy')).toBe('/privacy');
    expect(legalPageUrl('terms')).toBe('/terms');
    expect(legalPageUrl('accountDeletion')).toBe('/account-deletion');
  });
});
