import { buildEditorialDraft, type EditorialDraft } from '@qalago/ai-core';
import { contentAgent } from '@qalago/agents';
import { fetchCity, fetchFeaturedFallback } from './catalog-client';

const CITY_NAMES: Record<string, string> = {
  uralsk: 'Уральск',
  aktobe: 'Актобе',
};

export async function createContentDraft(params: {
  citySlug: string;
  topic?: string;
  limit?: number;
}): Promise<EditorialDraft & { agent: string; citySlug: string }> {
  const citySlug = params.citySlug || 'uralsk';
  const limit = params.limit ?? 5;

  let cityName = CITY_NAMES[citySlug];
  if (!cityName) {
    try {
      const city = await fetchCity(citySlug);
      cityName = city.nameRu;
    } catch {
      cityName = citySlug;
    }
  }

  const businesses = await fetchFeaturedFallback(citySlug, Math.max(limit, 10));
  const draft = buildEditorialDraft({
    cityName,
    citySlug,
    topic: params.topic,
    businesses,
    limit,
  });

  return {
    agent: contentAgent.name,
    citySlug,
    ...draft,
  };
}
