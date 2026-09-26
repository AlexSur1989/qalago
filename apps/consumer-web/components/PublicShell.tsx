'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { CitySwitcher } from '@/components/CitySwitcher';
import type { CityDto } from '@/lib/catalog-api';
import { legalPageUrl } from '@/lib/legal-links';
import { parsePublicLocaleFromPathname } from '@/lib/locale-path';
import { DEFAULT_PUBLIC_LOCALE } from '@/lib/public-locale';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import {
  cityCategoriesPath,
  cityHomePath,
  parseCitySlugFromPathname,
} from '@/lib/routes';
import { UI_LABELS, type AppLocale } from '@/lib/locale';

export function PublicShell({
  locale,
  cities,
  children,
}: {
  locale: AppLocale;
  cities: CityDto[];
  children: React.ReactNode;
}) {
  const labels = UI_LABELS[locale];
  const pathname = usePathname() ?? '/';
  const routeLocale = parsePublicLocaleFromPathname(pathname) ?? DEFAULT_PUBLIC_LOCALE;
  const citySlug = parseCitySlugFromPathname(pathname) ?? DEFAULT_CITY_SLUG;

  return (
    <div className="public-shell">
      <header className="public-shell__header">
        <div className="public-shell__brand">
          <Link
            href={cityHomePath(routeLocale, citySlug)}
            className="public-shell__logo"
            aria-label={labels.navHome}
          >
            QalaGo
          </Link>
        </div>
        <nav className="public-shell__nav" aria-label={labels.mainNavAria}>
          <Link href={cityHomePath(routeLocale, citySlug)}>{labels.navHome}</Link>
          <Link href={cityCategoriesPath(routeLocale, citySlug)}>{labels.categories}</Link>
        </nav>
        <div className="public-shell__tools">
          <CitySwitcher
            cities={cities}
            currentCitySlug={citySlug}
            locale={routeLocale}
            labels={labels}
          />
          <Suspense fallback={null}>
            <LocaleSwitcher locale={locale} labels={labels} />
          </Suspense>
        </div>
      </header>
      <div className="public-shell__content">{children}</div>
      <footer className="public-shell__footer">
        <nav className="public-shell__legal" aria-label={labels.footerLegalAria}>
          <a href={legalPageUrl('privacy')}>{labels.footerPrivacy}</a>
          <a href={legalPageUrl('terms')}>{labels.footerTerms}</a>
          <a href={legalPageUrl('accountDeletion')}>{labels.footerAccountDeletion}</a>
          <a href={legalPageUrl('help')}>{labels.footerSupport}</a>
        </nav>
        <p className="public-shell__copyright">{labels.footerCopyright}</p>
      </footer>
    </div>
  );
}
