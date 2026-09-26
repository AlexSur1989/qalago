import type { BreadcrumbCrumb } from '@/components/Breadcrumbs';
import type { CategoryDto, CityDto, SubcategoryDto } from '@/lib/catalog-api';
import { cityDisplayName } from '@/lib/localized-content';
import { UI_LABELS, categoryDisplayName, subcategoryDisplayName } from '@/lib/locale';
import type { PublicLocale } from '@/lib/public-locale';
import {
  cityCategoriesPath,
  cityCategoryPath,
  cityHomePath,
  citySubcategoryPath,
} from '@/lib/routes';
import type { BreadcrumbItem } from './json-ld';

const SITE_LABEL = 'QalaGo';

export function jsonLdFromCrumbs(crumbs: BreadcrumbCrumb[], currentPath: string): BreadcrumbItem[] {
  return crumbs.map((crumb, index) => ({
    name: crumb.label,
    path: crumb.href ?? (index === crumbs.length - 1 ? currentPath : currentPath),
  }));
}

export function breadcrumbsForCityCategories(city: CityDto, locale: PublicLocale): BreadcrumbCrumb[] {
  const labels = UI_LABELS[locale];
  const cityName = cityDisplayName(city, locale);
  return [
    { label: SITE_LABEL, href: cityHomePath(locale, city.slug) },
    { label: cityName, href: cityHomePath(locale, city.slug) },
    { label: labels.categories },
  ];
}

export function breadcrumbsForCategory(
  city: CityDto,
  category: CategoryDto,
  locale: PublicLocale,
): BreadcrumbCrumb[] {
  const cityName = cityDisplayName(city, locale);
  const catName = categoryDisplayName(category, locale);
  return [
    { label: SITE_LABEL, href: cityHomePath(locale, city.slug) },
    { label: cityName, href: cityHomePath(locale, city.slug) },
    { label: UI_LABELS[locale].categories, href: cityCategoriesPath(locale, city.slug) },
    { label: catName },
  ];
}

export function breadcrumbsForCanonicalBusiness(
  city: CityDto,
  businessTitle: string,
  locale: PublicLocale,
  category?: CategoryDto | null,
): BreadcrumbCrumb[] {
  const cityName = cityDisplayName(city, locale);
  const crumbs: BreadcrumbCrumb[] = [
    { label: SITE_LABEL, href: cityHomePath(locale, city.slug) },
    { label: cityName, href: cityHomePath(locale, city.slug) },
  ];
  if (category) {
    crumbs.push({
      label: categoryDisplayName(category, locale),
      href: cityCategoryPath(locale, city.slug, category.slug),
    });
  }
  crumbs.push({ label: businessTitle });
  return crumbs;
}

export function breadcrumbsForSubcategory(
  city: CityDto,
  category: CategoryDto,
  sub: SubcategoryDto,
  locale: PublicLocale,
): BreadcrumbCrumb[] {
  const cityName = cityDisplayName(city, locale);
  const catName = categoryDisplayName(category, locale);
  const subName = subcategoryDisplayName(sub, locale);
  return [
    { label: SITE_LABEL, href: cityHomePath(locale, city.slug) },
    { label: cityName, href: cityHomePath(locale, city.slug) },
    { label: UI_LABELS[locale].categories, href: cityCategoriesPath(locale, city.slug) },
    { label: catName, href: cityCategoryPath(locale, city.slug, category.slug) },
    { label: subName },
  ];
}
