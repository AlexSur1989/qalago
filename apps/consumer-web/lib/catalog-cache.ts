import { cache } from 'react';
import {
  fetchBusiness,
  fetchCategories,
  fetchCity,
  fetchCities,
  fetchSubcategories,
} from './catalog-api';

/** Dedupe catalog fetches between generateMetadata and page render (F.3). */
export const cachedFetchCity = cache(fetchCity);
export const cachedFetchCities = cache(fetchCities);
export const cachedFetchCategories = cache((citySlug: string) => fetchCategories(citySlug));
export const cachedFetchSubcategories = cache((categoryId: string) =>
  fetchSubcategories(categoryId),
);
export const cachedFetchBusiness = cache(fetchBusiness);
