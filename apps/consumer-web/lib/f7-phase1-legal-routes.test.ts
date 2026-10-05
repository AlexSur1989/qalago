import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGAL_PLACEHOLDERS, hasUnresolvedLegalPlaceholders } from './legal-config';
import {
  PUBLIC_LEGAL_ROOT_SEGMENTS,
  isPublicLegalRootPath,
  publicLegalPath,
} from './legal-paths';
import {
  joinRedirectTarget,
  resolveMiddlewareLocaleRedirect,
} from './middleware-public-locale-redirect';

const APP_ROOT = join(import.meta.dirname, '..');

function resolve(pathname: string, cookie?: string) {
  return resolveMiddlewareLocaleRedirect(pathname, new URLSearchParams(), cookie ?? null);
}

describe('F.7 Phase 1 legal routes', () => {
  it('defines locale-neutral public legal root segments (F.7 + 6.15L extended)', () => {
    expect(PUBLIC_LEGAL_ROOT_SEGMENTS).toEqual([
      'privacy',
      'terms',
      'account-deletion',
      'community',
      'personal-data-consent',
      'business-terms',
      'offer',
      'advertising-rules',
      'cookies',
    ]);
  });

  it('route page files exist under app/', () => {
    for (const segment of PUBLIC_LEGAL_ROOT_SEGMENTS) {
      const pagePath = join(APP_ROOT, 'app', segment, 'page.tsx');
      expect(existsSync(pagePath), pagePath).toBe(true);
    }
  });

  it('uses env-backed legal placeholders', () => {
    expect(LEGAL_PLACEHOLDERS.operatorName).toBeTruthy();
    expect(hasUnresolvedLegalPlaceholders()).toBe(true);
  });

  it('account-deletion content is informational (no web delete action)', () => {
    const src = join(APP_ROOT, 'app', 'account-deletion', 'page.tsx');
    const content = readFileSync(src, 'utf8');
    expect(content).toContain('информационная');
    expect(content).not.toMatch(/DELETE\s*\/users\/me.*button/i);
    expect(content).not.toContain('onSubmit');
  });

  describe('middleware locale redirect', () => {
    it('does not prefix /privacy with /ru', () => {
      const d = resolve('/privacy');
      expect(d.kind).toBe('none');
      expect(redirectTarget('/privacy')).toBeNull();
    });

    it('does not prefix /terms or /account-deletion', () => {
      expect(redirectTarget('/terms')).toBeNull();
      expect(redirectTarget('/account-deletion')).toBeNull();
    });

    it('keeps legal paths neutral regardless of cookie', () => {
      expect(redirectTarget('/privacy', 'qalago_locale=kk')).toBeNull();
    });

    it('does not treat nested paths as legal roots', () => {
      expect(isPublicLegalRootPath('/uralsk/privacy')).toBe(false);
      expect(redirectTarget('/uralsk/privacy')).toBe('/kk/uralsk/privacy');
    });

    it('does not introduce /ru/privacy as canonical redirect target', () => {
      expect(redirectTarget('/privacy')).not.toBe('/ru/privacy');
      expect(redirectTarget('/privacy')).not.toBe('/kk/privacy');
    });
  });

  it('publicLegalPath builds root URLs', () => {
    expect(publicLegalPath('privacy')).toBe('/privacy');
  });
});

function redirectTarget(pathname: string, cookie?: string): string | null {
  const decision = resolve(pathname, cookie);
  if (decision.kind !== 'permanent') return null;
  return joinRedirectTarget(decision.pathname, decision.search);
}
