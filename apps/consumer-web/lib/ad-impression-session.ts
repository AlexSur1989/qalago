'use client';

const sentImpressionKeys = new Set<string>();

export function adImpressionKey(campaignId: string, placementId: string): string {
  return `${campaignId}:${placementId}`;
}

export function hasAdImpressionBeenSent(campaignId: string, placementId: string): boolean {
  return sentImpressionKeys.has(adImpressionKey(campaignId, placementId));
}

export function markAdImpressionSent(campaignId: string, placementId: string): void {
  sentImpressionKeys.add(adImpressionKey(campaignId, placementId));
}

/** Test-only reset. */
export function resetAdImpressionSessionForTests(): void {
  sentImpressionKeys.clear();
}
