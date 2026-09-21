import { notFound } from 'next/navigation';
import { cachedFetchCategories, cachedFetchCity } from './catalog-cache';

export async function requireCity(citySlug: string) {
  const city = await cachedFetchCity(citySlug);
  if (!city) notFound();
  return city;
}

export async function requireCityCategories(citySlug: string) {
  const [city, categories] = await Promise.all([
    cachedFetchCity(citySlug),
    cachedFetchCategories(citySlug),
  ]);
  if (!city) notFound();
  return { city, categories };
}
