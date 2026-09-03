import { recommendationAgent } from '@qalago/agents';
import { toRecommendationItems, type RecommendationResult } from '@qalago/ai-core';
import { fetchFeaturedFallback, fetchPersonalRecommendations } from './catalog-client';

export async function recommend(params: {
  citySlug: string;
  authorization?: string;
  limit?: number;
}): Promise<RecommendationResult & { agent: string }> {
  const limit = params.limit ?? 10;
  let businesses;

  if (params.authorization) {
    try {
      businesses = await fetchPersonalRecommendations(
        params.citySlug,
        params.authorization.replace(/^Bearer\s+/i, ''),
      );
    } catch {
      businesses = await fetchFeaturedFallback(params.citySlug, limit);
    }
  } else {
    businesses = await fetchFeaturedFallback(params.citySlug, limit);
  }

  return {
    agent: recommendationAgent.name,
    source: 'rule-based',
    items: toRecommendationItems(businesses, limit),
  };
}
