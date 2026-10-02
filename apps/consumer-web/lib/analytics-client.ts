'use client';

import { getApiBaseUrl } from './public-config';
import { WEB_SESSION_COOKIE, isValidWebSessionId } from './web-session-constants';

const API_BASE = getApiBaseUrl();

export type OrganicAnalyticsPayload = {
  type: string;
  businessId?: string;
  cityId?: string;
  businessLocationId?: string;
  trafficSource?: string;
  discoverySurface?: string;
  searchQuery?: string;
  promotionId?: string;
  position?: number;
};

function readSessionIdFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${WEB_SESSION_COOKIE}=`));
  if (!match) return undefined;
  const value = decodeURIComponent(match.slice(WEB_SESSION_COOKIE.length + 1));
  return isValidWebSessionId(value) ? value : undefined;
}

function newClientEventId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Best-effort analytics POST; never throws to callers. */
export async function postOrganicAnalyticsEvent(
  payload: OrganicAnalyticsPayload,
): Promise<void> {
  try {
    const sessionId = readSessionIdFromCookie();
    await fetch(`${API_BASE}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        clientEventId: newClientEventId(),
        platform: 'WEB',
        ...(sessionId ? { sessionId } : {}),
      }),
      keepalive: true,
    });
  } catch {
    // Non-blocking by design.
  }
}

export async function postAdAnalyticsEvent(params: {
  campaignId: string;
  placementCode: string;
  sessionId: string;
  type: 'AD_IMPRESSION' | 'AD_CLICK';
  position?: number;
}): Promise<boolean> {
  try {
    await fetch(`${API_BASE}/monetization/ads/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        platform: 'WEB',
      }),
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}
