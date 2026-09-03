export {
  analyzeReviewText,
  type ModerationAction,
  type ModerationFlag,
  type ModerationResult,
  type ModerationSeverity,
} from './moderation';

export interface RecommendationItem {
  businessId: string;
  reason: string;
}

export interface RecommendationResult {
  items: RecommendationItem[];
  source: 'rule-based' | 'llm';
}

export interface RecommendRequest {
  citySlug: string;
  limit?: number;
}

export type CatalogBusiness = {
  id: string;
  title: string;
  isFeatured?: boolean;
  category?: { title?: string; slug?: string };
};

export {
  buildEditorialDraft,
  type EditorialDraft,
} from './content';

/** Map catalog businesses to recommendation items (rule-based MVP). */
export function toRecommendationItems(
  businesses: CatalogBusiness[],
  limit = 10,
): RecommendationItem[] {
  return businesses.slice(0, limit).map((b) => ({
    businessId: b.id,
    reason: b.isFeatured
      ? `VIP в ${b.category?.title ?? 'категории'}`
      : `Популярное: ${b.title}`,
  }));
}
