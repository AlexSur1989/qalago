import { fetchAiRecommendationsSafe } from './ai-recommendations-api';
import type { AdServeItemDto } from './ads-types';
import { collectPaidBusinessIds } from './collect-paid-business-ids';
import {
  fetchBusiness,
  fetchBusinesses,
  type BusinessSummaryDto,
} from './catalog-api';
import { toPublicBusinessCard, type PublicBusinessCard } from './public-business';
import type { HomeSectionDataSlice } from './home-discovery-data';

export type HomePopularEntry = PublicBusinessCard & {
  /** Shown only when sourced from AI recommendations. */
  subtitle: string | null;
};

export type HomePopularLoadMeta = {
  source: 'ai' | 'organic';
};

async function mapSummariesToPopular(
  items: BusinessSummaryDto[],
  reasonsById?: Map<string, string>,
): Promise<HomePopularEntry[]> {
  return items.map((raw) => {
    const card = toPublicBusinessCard(raw);
    const reason = reasonsById?.get(raw.id)?.trim();
    return {
      ...card,
      subtitle: reason && reason.length > 0 ? reason : null,
    };
  });
}

function excludePaidIds<T extends { id: string }>(
  items: T[],
  paidIds: Set<string>,
): T[] {
  if (!paidIds.size) return items;
  return items.filter((item) => !paidIds.has(item.id));
}

export async function loadHomePopularSection(
  citySlug: string,
  featuredAds: AdServeItemDto[],
): Promise<
  HomeSectionDataSlice<HomePopularEntry[]> & { meta?: HomePopularLoadMeta }
> {
  const paidIds = collectPaidBusinessIds(featuredAds);

  try {
    const aiItems = await fetchAiRecommendationsSafe(citySlug, 10);
    if (aiItems.length) {
      const reasons = new Map(aiItems.map((i) => [i.businessId, i.reason ?? '']));
      const details = await Promise.all(
        aiItems.map(async (item) => {
          try {
            return await fetchBusiness(item.businessId);
          } catch {
            return null;
          }
        }),
      );
      const summaries = details.filter(
        (d): d is BusinessSummaryDto => d != null && d.slug?.length > 0,
      );
      const filtered = excludePaidIds(summaries, paidIds);
      if (filtered.length) {
        return {
          status: 'ready',
          data: await mapSummariesToPopular(filtered, reasons),
          meta: { source: 'ai' },
        };
      }
    }
  } catch {
    // Fall through to organic listing.
  }

  try {
    const organic = await fetchBusinesses({ citySlug, limit: 10, page: 1 });
    const filtered = excludePaidIds(organic.items ?? [], paidIds);
    if (!filtered.length) {
      return { status: 'ready', data: [], meta: { source: 'organic' } };
    }
    return {
      status: 'ready',
      data: await mapSummariesToPopular(filtered),
      meta: { source: 'organic' },
    };
  } catch {
    return { status: 'error' };
  }
}
