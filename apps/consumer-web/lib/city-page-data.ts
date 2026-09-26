import { notFound } from 'next/navigation';
import { cachedFetchCategories, cachedFetchCity } from './catalog-cache';

export async function requireCity(citySlug: string) {
  const city = await cachedFetchCity(citySlug);
  if (!city) notFound();
  return city;
}

export async function requireCityCategories(citySlug: string) {
  // Validate the canonical city before dependent city-scoped requests.
  // Otherwise an unknown city's categories 404 becomes an accidental 500.
  const city = await requireCity(citySlug);
  const categories = await cachedFetchCategories(city.slug);
  return { city, categories };
}
