import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UI_LABELS } from './locale';
import { legalPageUrl, isSameOriginLegalLink } from './legal-links';
import {
  PUBLIC_HELP_ROOT_SEGMENT,
  isPublicHelpRootPath,
  isPublicLocaleNeutralRootPath,
  publicHelpPath,
} from './legal-paths';
import { HELP_UI } from './help-ui';
import { DEFAULT_CITY_SLUG } from './public-config';
import {
  cityCategoriesPath,
  cityHomePath,
  parseCitySlugFromPathname,
} from './routes';
import {
  joinRedirectTarget,
  resolveMiddlewareLocaleRedirect,
} from './middleware-public-locale-redirect';
import { canonicalForHelpPage } from './seo/canonical';
import { buildLocaleNeutralPublicSitemapEntries } from './seo/sitemap-builder';

const APP_ROOT = join(import.meta.dirname, '..');

function redirectTarget(pathname: string, cookie?: string): string | null {
  const decision = resolveMiddlewareLocaleRedirect(
    pathname,
    new URLSearchParams(),
    cookie ?? null,
  );
  if (decision.kind !== 'permanent') return null;
  return joinRedirectTarget(decision.pathname, decision.search);
}

function publicShellNavHrefs(pathname: string, layoutLocale: 'ru' | 'kk') {
  const citySlug = parseCitySlugFromPathname(pathname) ?? DEFAULT_CITY_SLUG;
  return {
    logo: cityHomePath(layoutLocale, citySlug),
    categories: cityCategoriesPath(layoutLocale, citySlug),
    footerHelp: legalPageUrl('help'),
    footerPrivacy: legalPageUrl('privacy'),
    footerTerms: legalPageUrl('terms'),
    footerAccountDeletion: legalPageUrl('accountDeletion'),
  };
}

describe('Public help — Consumer Web /help', () => {
  it('A: /help route file exists', () => {
    expect(existsSync(join(APP_ROOT, 'app', 'help', 'page.tsx'))).toBe(true);
  });

  it('B: /help page is static guest content (no auth/API)', () => {
    const src = readFileSync(join(APP_ROOT, 'app', 'help', 'page.tsx'), 'utf8');
    expect(src).not.toContain('useAuth');
    expect(src).not.toContain('fetch(');
    expect(src).not.toContain('ownerApi');
    expect(src).toContain('HELP_UI');
  });

  it('C–D: footer help is same-origin and not Business Web base', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'http://localhost:3003';
    expect(legalPageUrl('help')).toBe('/help');
    expect(isSameOriginLegalLink('help')).toBe(true);
    expect(legalPageUrl('help')).not.toContain('3003');
  });

  it('E–F: footer labels RU/KK', () => {
    expect(UI_LABELS.ru.footerSupport).toBe('Поддержка');
    expect(UI_LABELS.kk.footerSupport).toBe('Қолдау');
  });

  it('G–H: PublicShell nav on /help for RU and KK', () => {
    const ru = publicShellNavHrefs('/help', 'ru');
    expect(ru.logo).toBe(`/ru/${DEFAULT_CITY_SLUG}`);
    expect(ru.categories).toBe(`/ru/${DEFAULT_CITY_SLUG}/categories`);
    expect(ru.logo).not.toBe('/ru/help');

    const kk = publicShellNavHrefs('/help', 'kk');
    expect(kk.logo).toBe(`/kk/${DEFAULT_CITY_SLUG}`);
    expect(kk.categories).toBe(`/kk/${DEFAULT_CITY_SLUG}/categories`);
  });

  it('I: legal footer links unchanged', () => {
    const h = publicShellNavHrefs('/help', 'ru');
    expect(h.footerPrivacy).toBe('/privacy');
    expect(h.footerTerms).toBe('/terms');
    expect(h.footerAccountDeletion).toBe('/account-deletion');
  });

  it('J: middleware does not prefix /help with locale', () => {
    expect(redirectTarget('/help')).toBeNull();
    expect(redirectTarget('/help', 'qalago_locale=kk')).toBeNull();
    expect(isPublicHelpRootPath('/help')).toBe(true);
    expect(parseCitySlugFromPathname('/help')).toBeNull();
  });

  it('SEO: single locale-neutral canonical for help', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'https://qalago.kz';
    expect(canonicalForHelpPage()).toBe('https://qalago.kz/help');
    const urls = buildLocaleNeutralPublicSitemapEntries().map((e) => e.url);
    expect(urls.filter((u) => u.endsWith('/help'))).toHaveLength(1);
    expect(urls).not.toContain('https://qalago.kz/ru/help');
  });

  it('RU/KK help content sourced from Flutter consumer FAQ keys', () => {
    expect(HELP_UI.ru.faq).toHaveLength(4);
    expect(HELP_UI.kk.faq).toHaveLength(4);
    expect(HELP_UI.ru.faq[0]?.q).toBe('Как добавить заведение?');
    expect(HELP_UI.kk.pageHeading).toBe('Көмек');
  });

  it('/support compat redirect route exists', () => {
    expect(existsSync(join(APP_ROOT, 'app', 'support', 'page.tsx'))).toBe(true);
    expect(isPublicLocaleNeutralRootPath('/support')).toBe(true);
    expect(redirectTarget('/support')).toBeNull();
  });

  it('K: Business Web owner help page still exists', () => {
    const ownerHelp = join(APP_ROOT, '..', 'business-web', 'app', 'help', 'page.tsx');
    expect(existsSync(ownerHelp)).toBe(true);
    const src = readFileSync(ownerHelp, 'utf8');
    expect(src).toContain('useAuth');
    expect(src).toContain('BusinessShell');
  });

  it('defines public help root segment', () => {
    expect(PUBLIC_HELP_ROOT_SEGMENT).toBe('help');
    expect(publicHelpPath()).toBe('/help');
  });
});
