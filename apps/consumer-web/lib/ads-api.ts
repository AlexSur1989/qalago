import { getApiBaseUrl } from './public-config';
import type { AdServeItemDto, AdServeResponseDto } from './ads-types';

const API_BASE = getApiBaseUrl();

export function parseAdServeItem(raw: unknown): AdServeItemDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const campaignId = o.campaignId;
  const placementId = o.placementId;
  const placementCode = o.placementCode;
  if (
    typeof campaignId !== 'string' ||
    typeof placementId !== 'string' ||
    typeof placementCode !== 'string'
  ) {
    return null;
  }
  return {
    campaignId,
    placementId,
    placementCode,
    position: typeof o.position === 'number' ? o.position : 1,
    sponsored: o.sponsored === true || o.sponsored === undefined,
    displayLabel: typeof o.displayLabel === 'string' ? o.displayLabel : '',
    productType: typeof o.productType === 'string' ? o.productType : null,
    business: (o.business as AdServeItemDto['business']) ?? null,
    creative: (o.creative as AdServeItemDto['creative']) ?? null,
    promotion: (o.promotion as AdServeItemDto['promotion']) ?? null,
    destinationLocationId:
      typeof o.destinationLocationId === 'string' ? o.destinationLocationId : null,
    contextLocationId:
      typeof o.contextLocationId === 'string' ? o.contextLocationId : null,
  };
}

export async function fetchAdServe(params: {
  placementCode: string;
  citySlug: string;
  sessionId: string;
  categoryId?: string;
  limit?: number;
}): Promise<AdServeItemDto[]> {
  const q = new URLSearchParams({
    placementCode: params.placementCode,
    citySlug: params.citySlug,
    sessionId: params.sessionId,
    platform: 'WEB',
  });
  if (params.categoryId) q.set('categoryId', params.categoryId);
  if (params.limit != null) q.set('limit', String(params.limit));

  try {
    const res = await fetch(`${API_BASE}/monetization/ads/serve?${q.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = (await res.json()) as AdServeResponseDto;
    const items = Array.isArray(body.items) ? body.items : [];
    return items.map(parseAdServeItem).filter((x): x is AdServeItemDto => x != null);
  } catch {
    return [];
  }
}
