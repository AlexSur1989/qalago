import type { BreadcrumbCrumb } from '@/components/Breadcrumbs';
import type { CategoryDto, CityDto, SubcategoryDto } from '@/lib/catalog-api';
import { cityDisplayName } from '@/lib/localized-content';
import {
  UI_LABELS,
  categoryDisplayName,
  subcategoryDisplayName,
  type AppLocale,
} from '@/lib/locale';
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

export function breadcrumbsForCityCategories(city: CityDto, locale: AppLocale): BreadcrumbCrumb[] {
  const labels = UI_LABELS[locale];
  const cityName = cityDisplayName(city, locale);
  return [
    { label: SITE_LABEL, href: cityHomePath(city.slug) },
    { label: cityName, href: cityHomePath(city.slug) },
    { label: labels.categories },
  ];
}

export function breadcrumbsForCategory(
  city: CityDto,
  category: CategoryDto,
  locale: AppLocale,
): BreadcrumbCrumb[] {
  const cityName = cityDisplayName(city, locale);
  const catName = categoryDisplayName(category, locale);
  return [
    { label: SITE_LABEL, href: cityHomePath(city.slug) },
    { label: cityName, href: cityHomePath(city.slug) },
    { label: UI_LABELS[locale].categories, href: cityCategoriesPath(city.slug) },
    { label: catName },
  ];
}

export function breadcrumbsForSubcategory(
  city: CityDto,
  category: CategoryDto,
  sub: SubcategoryDto,
  locale: AppLocale,
): BreadcrumbCrumb[] {
  const cityName = cityDisplayName(city, locale);
  const catName = categoryDisplayName(category, locale);
  const subName = subcategoryDisplayName(sub, locale);
  return [
    { label: SITE_LABEL, href: cityHomePath(city.slug) },
    { label: cityName, href: cityHomePath(city.slug) },
    { label: UI_LABELS[locale].categories, href: cityCategoriesPath(city.slug) },
    { label: catName, href: cityCategoryPath(city.slug, category.slug) },
    { label: subName },
  ];
}
