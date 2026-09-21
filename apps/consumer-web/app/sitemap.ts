import type { MetadataRoute } from 'next';
import { fetchCategories, fetchCities, fetchSubcategories } from '@/lib/catalog-api';
import { buildDiscoverySitemapEntries } from '@/lib/seo/sitemap-builder';

/**
 * Public discovery sitemap (F.3). On API failure returns empty list (no fabricated URLs).
 * Future: sitemap index when city×category exceeds platform limits.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const cities = await fetchCities();
    const categoriesByCitySlug: Record<string, Awaited<ReturnType<typeof fetchCategories>>> = {};
    const subcategoriesByCategoryId: Record<
      string,
      Awaited<ReturnType<typeof fetchSubcategories>>
    > = {};

    await Promise.all(
      cities.map(async (city) => {
        const categories = await fetchCategories(city.slug);
        categoriesByCitySlug[city.slug] = categories;
        await Promise.all(
          categories.map(async (cat) => {
            subcategoriesByCategoryId[cat.id] = await fetchSubcategories(cat.id);
          }),
        );
      }),
    );

    const entries = buildDiscoverySitemapEntries({
      cities,
      categoriesByCitySlug,
      subcategoriesByCategoryId,
    });

    return entries.map((e) => ({
      url: e.url,
      lastModified: e.lastModified,
    }));
  } catch {
    return [];
  }
}
