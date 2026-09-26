import type { Metadata } from 'next';
import {
  canonicalForBusiness,
  canonicalForCategory,
  canonicalForCity,
  canonicalForCityCategories,
  canonicalForSearch,
  canonicalForSubcategory,
  getConsumerWebOrigin,
} from './canonical';
import {
  categorySeoDescription,
  categorySeoTitle,
  cityCategoriesSeoDescription,
  cityCategoriesSeoTitle,
  citySeoDescription,
  citySeoTitle,
  searchSeoTitle,
  subcategorySeoDescription,
  subcategorySeoTitle,
} from './metadata-copy';
import type { AppLocale } from '@/lib/locale';

const NOINDEX_FOLLOW = { index: false as const, follow: true as const };

function ogBasics(title: string, description: string, url: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'QalaGo',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export function metadataForCity(
  citySlug: string,
  cityName: string,
  locale: AppLocale,
): Metadata {
  const title = citySeoTitle(cityName, locale);
  const description = citySeoDescription(cityName, locale);
  return ogBasics(title, description, canonicalForCity(citySlug));
}

export function metadataForCityCategories(
  citySlug: string,
  cityName: string,
  locale: AppLocale,
): Metadata {
  const title = cityCategoriesSeoTitle(cityName, locale);
  const description = cityCategoriesSeoDescription(cityName, locale);
  return ogBasics(title, description, canonicalForCityCategories(citySlug));
}

export function metadataForCategory(
  citySlug: string,
  cityName: string,
  categorySlug: string,
  categoryName: string,
  locale: AppLocale,
  page: number,
): Metadata {
  const title = categorySeoTitle(categoryName, cityName, locale);
  const description = categorySeoDescription(categoryName, cityName, locale);
  const canonical = canonicalForCategory(citySlug, categorySlug, page);
  return ogBasics(title, description, canonical);
}

export function metadataForSubcategory(
  citySlug: string,
  cityName: string,
  categorySlug: string,
  categoryName: string,
  subSlug: string,
  subName: string,
  locale: AppLocale,
  page: number,
): Metadata {
  const title = subcategorySeoTitle(subName, categoryName, cityName, locale);
  const description = subcategorySeoDescription(subName, categoryName, cityName, locale);
  const canonical = canonicalForSubcategory(citySlug, categorySlug, subSlug, page);
  return ogBasics(title, description, canonical);
}

export function metadataForSearch(
  citySlug: string,
  cityName: string,
  locale: AppLocale,
  query: string,
): Metadata {
  const title = searchSeoTitle(cityName, locale);
  const description =
    locale === 'kk'
      ? `${cityName} қаласындағы мекемелерді іздеу — QalaGo.`
      : `Поиск заведений в ${cityName} на QalaGo.`;
  const url = canonicalForSearch(citySlug, query);
  return {
    ...ogBasics(title, description, url),
    robots: NOINDEX_FOLLOW,
  };
}

/** Temporary ID business pages until F.4 / 6.12A — no false future canonical. */
export function metadataForTemporaryBusinessDetail(title: string): Metadata {
  return {
    title: `${title} | QalaGo`,
    robots: NOINDEX_FOLLOW,
  };
}

/** F.4 canonical business page — indexable; canonical excludes ?locationId=. */
export function metadataForCanonicalBusiness(
  citySlug: string,
  businessSlug: string,
  businessTitle: string,
  description: string | null | undefined,
  locale: AppLocale,
): Metadata {
  const title = businessTitle;
  const desc =
    description?.trim() ||
    (locale === 'kk'
      ? `${businessTitle} — QalaGo қалалық нұсқауы.`
      : `${businessTitle} — городской гид QalaGo.`);
  const url = canonicalForBusiness(citySlug, businessSlug);
  return {
    ...ogBasics(title, desc, url),
    robots: { index: true, follow: true },
  };
}

export function rootSiteMetadata(locale: AppLocale, defaultTitle: string, description: string): Metadata {
  const origin = getConsumerWebOrigin();
  return {
    metadataBase: new URL(origin),
    title: {
      default: defaultTitle,
      template: '%s | QalaGo',
    },
    description,
    openGraph: {
      siteName: 'QalaGo',
      type: 'website',
      locale: locale === 'kk' ? 'kk_KZ' : 'ru_RU',
      title: defaultTitle,
      description,
    },
    twitter: {
      card: 'summary',
      title: defaultTitle,
      description,
    },
  };
}
