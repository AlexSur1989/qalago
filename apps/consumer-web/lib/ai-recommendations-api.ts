import { getApiBaseUrl } from './public-config';

const API_BASE = getApiBaseUrl();

export type AiRecommendationItem = {
  businessId: string;
  reason: string;
};

export type AiRecommendationsResponse = {
  items: AiRecommendationItem[];
};

/** Guest-safe proxy (`@Public()` on catalog-api). Returns empty on failure. */
export async function fetchAiRecommendationsSafe(
  citySlug: string,
  limit = 10,
): Promise<AiRecommendationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/ai/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citySlug, limit }),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as AiRecommendationsResponse;
    const items = data.items ?? [];
    return items.filter((i) => i.businessId?.trim());
  } catch {
    return [];
  }
}
