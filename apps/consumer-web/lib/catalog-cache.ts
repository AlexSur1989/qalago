import { cache } from 'react';
import {
  fetchBusiness,
  fetchPublicBusinessLocations,
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
/** Cache key is (businessId, locationId|null) — distinct branches must not share entries. */
export const cachedFetchBusiness = cache((id: string, locationId?: string | null) =>
  fetchBusiness(id, locationId),
);
export const cachedFetchPublicBusinessLocations = cache(fetchPublicBusinessLocations);
