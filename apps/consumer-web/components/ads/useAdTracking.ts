'use client';

import { useCallback } from 'react';
import { AD_EVENT } from '@/lib/ad-placements';
import {
  hasAdImpressionBeenSent,
  markAdImpressionSent,
} from '@/lib/ad-impression-session';
import { postAdAnalyticsEvent } from '@/lib/analytics-client';
import type { AdTrackingContext } from '@/lib/ads-types';

export function useAdTracking(context: AdTrackingContext) {
  const trackImpression = useCallback(async () => {
    if (hasAdImpressionBeenSent(context.campaignId, context.placementId)) return;
    const ok = await postAdAnalyticsEvent({
      campaignId: context.campaignId,
      placementCode: context.placementCode,
      sessionId: context.sessionId,
      type: AD_EVENT.IMPRESSION,
      position: context.position,
    });
    if (ok) markAdImpressionSent(context.campaignId, context.placementId);
  }, [context]);

  const trackClick = useCallback(() => {
    void postAdAnalyticsEvent({
      campaignId: context.campaignId,
      placementCode: context.placementCode,
      sessionId: context.sessionId,
      type: AD_EVENT.CLICK,
      position: context.position,
    });
  }, [context]);

  return { trackImpression, trackClick };
}
