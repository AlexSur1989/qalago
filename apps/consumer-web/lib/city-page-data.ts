import { notFound } from 'next/navigation';
import { fetchCategories, fetchCity } from './catalog-api';

export async function requireCity(citySlug: string) {
  const city = await fetchCity(citySlug);
  if (!city) notFound();
  return city;
}

export async function requireCityCategories(citySlug: string) {
  const [city, categories] = await Promise.all([
    fetchCity(citySlug),
    fetchCategories(citySlug),
  ]);
  if (!city) notFound();
  return { city, categories };
}
