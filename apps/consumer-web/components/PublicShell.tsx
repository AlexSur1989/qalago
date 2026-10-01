'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { CitySwitcher } from '@/components/CitySwitcher';
import { MobileNav } from '@/components/public/MobileNav';
import { QalaGoWordmark } from '@/components/public/QalaGoWordmark';
import { SkipToMain } from '@/components/public/SkipToMain';
import type { CityDto } from '@/lib/catalog-api';
import { legalPageUrl } from '@/lib/legal-links';
import { resolveEffectivePublicLocale } from '@/lib/locale-path';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import {
  cityCategoriesPath,
  cityHomePath,
  parseCitySlugFromPathname,
} from '@/lib/routes';
import { UI_LABELS, type AppLocale } from '@/lib/locale';

function isNavCurrent(pathname: string, href: string): boolean {
  if (href === pathname) return true;
  return pathname.startsWith(`${href}/`);
}

export function PublicShell({
  locale,
  cities,
  children,
}: {
  locale: AppLocale;
  cities: CityDto[];
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '/';
  const activeLocale = resolveEffectivePublicLocale(pathname, locale);
  const labels = UI_LABELS[activeLocale];
  const citySlug = parseCitySlugFromPathname(pathname) ?? DEFAULT_CITY_SLUG;
  const homeHref = cityHomePath(activeLocale, citySlug);
  const categoriesHref = cityCategoriesPath(activeLocale, citySlug);

  const navLinks = [
    { href: homeHref, label: labels.navHome, current: isNavCurrent(pathname, homeHref) },
    {
      href: categoriesHref,
      label: labels.categories,
      current: isNavCurrent(pathname, categoriesHref),
    },
  ];

  return (
    <div className="public-shell">
      <SkipToMain label={labels.skipToContent} />
      <header className="public-shell__header">
        <div className="public-shell__header-inner">
          <div className="public-shell__start">
            <MobileNav links={navLinks} labels={labels} />
            <QalaGoWordmark href={homeHref} ariaLabel={labels.navHome} />
          </div>
          <nav className="public-shell__nav public-shell__nav--desktop" aria-label={labels.mainNavAria}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`public-shell__nav-link${link.current ? ' public-shell__nav-link--current' : ''}`}
                aria-current={link.current ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="public-shell__tools">
            <CitySwitcher
              cities={cities}
              currentCitySlug={citySlug}
              locale={activeLocale}
              labels={labels}
            />
            <Suspense fallback={null}>
              <LocaleSwitcher locale={locale} />
            </Suspense>
          </div>
        </div>
      </header>
      <main id="main-content" className="public-shell__main" tabIndex={-1}>
        {children}
      </main>
      <footer className="public-shell__footer">
        <nav className="public-shell__legal" aria-label={labels.footerLegalAria}>
          {(['privacy', 'terms', 'accountDeletion', 'help'] as const).map((key) => {
            const href = legalPageUrl(key);
            const label =
              key === 'privacy'
                ? labels.footerPrivacy
                : key === 'terms'
                  ? labels.footerTerms
                  : key === 'accountDeletion'
                    ? labels.footerAccountDeletion
                    : labels.footerSupport;
            return (
              <Link key={key} href={href}>
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="public-shell__copyright">{labels.footerCopyright}</p>
      </footer>
    </div>
  );
}
