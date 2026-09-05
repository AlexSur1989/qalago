import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';

export type RotationCandidate = {
  id: string;
  qualifiedImpressions: number;
  weight: number;
  lastTopPositionAt: Date | null;
};

export function normalizedImpressionRatio(candidate: RotationCandidate): number {
  const weight = candidate.weight > 0 ? candidate.weight : 1;
  return candidate.qualifiedImpressions / weight;
}

export function sessionScopeKey(
  placement: string,
  cityId: string,
  categoryId?: string | null,
): string {
  return `${placement}:${cityId}:${categoryId ?? ''}`;
}

export function rotationTieBreakHash(
  sessionId: string,
  campaignId: string,
  scope: string,
): number {
  return createHash('sha256')
    .update(`${sessionId}:${campaignId}:${scope}`)
    .digest()
    .readUInt32BE(0);
}

export function fairSort(
  campaigns: RotationCandidate[],
  sessionId: string,
  scope: string,
): RotationCandidate[] {
  return [...campaigns].sort((a, b) => {
    const ratioDiff =
      normalizedImpressionRatio(a) - normalizedImpressionRatio(b);
    if (ratioDiff !== 0) {
      return ratioDiff;
    }
    return (
      rotationTieBreakHash(sessionId, a.id, scope) -
      rotationTieBreakHash(sessionId, b.id, scope)
    );
  });
}

export function assignPositions(
  campaigns: RotationCandidate[],
  sessionId: string,
  scope: string,
  placementCode: string,
  maxVisible: number,
): Array<{ campaign: RotationCandidate; position: number }> {
  if (campaigns.length === 0 || maxVisible <= 0) {
    return [];
  }

  const sorted = fairSort(campaigns, sessionId, scope);
  const limit = Math.min(maxVisible, sorted.length);

  if (placementCode === 'CATEGORY_TOP' && limit > 0) {
    const top1 = [...sorted].sort((a, b) => {
      if (a.lastTopPositionAt === null && b.lastTopPositionAt === null) {
        return (
          rotationTieBreakHash(sessionId, a.id, scope) -
          rotationTieBreakHash(sessionId, b.id, scope)
        );
      }
      if (a.lastTopPositionAt === null) return -1;
      if (b.lastTopPositionAt === null) return 1;
      return a.lastTopPositionAt.getTime() - b.lastTopPositionAt.getTime();
    })[0]!;

    const rest = sorted.filter((c) => c.id !== top1.id).slice(0, limit - 1);
    return [
      { campaign: top1, position: 1 },
      ...rest.map((campaign, index) => ({
        campaign,
        position: index + 2,
      })),
    ];
  }

  return sorted.slice(0, limit).map((campaign, index) => ({
    campaign,
    position: index + 1,
  }));
}

/** Monte-Carlo distribution check helper for unit tests. */
export function simulateRotationDistribution(
  campaigns: RotationCandidate[],
  sessionCount: number,
  scope: string,
  maxVisible = 1,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of campaigns) {
    counts.set(c.id, 0);
  }

  for (let i = 0; i < sessionCount; i++) {
    const sessionId = `sim-session-${i}`;
    const assigned = assignPositions(
      campaigns,
      sessionId,
      scope,
      'HOME_FEATURED',
      maxVisible,
    );
    for (const row of assigned) {
      counts.set(row.campaign.id, (counts.get(row.campaign.id) ?? 0) + 1);
    }
  }

  return counts;
}

@Injectable()
export class AdRotationService {
  selectCampaigns(
    campaigns: RotationCandidate[],
    sessionId: string,
    placementCode: string,
    cityId: string,
    categoryId: string | null | undefined,
    maxVisible: number,
  ) {
    const scope = sessionScopeKey(placementCode, cityId, categoryId);
    return assignPositions(
      campaigns,
      sessionId,
      scope,
      placementCode,
      maxVisible,
    );
  }
}
