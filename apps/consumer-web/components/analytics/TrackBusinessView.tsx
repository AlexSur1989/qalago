'use client';

import { useEffect, useRef } from 'react';
import { postOrganicAnalyticsEvent } from '@/lib/analytics-client';

type Props = {
  businessId: string;
  cityId?: string | null;
  businessLocationId?: string | null;
  trafficSource?: string;
  searchQuery?: string | null;
};

/** One VIEW_BUSINESS per mount (branch reload = new mount). */
export function TrackBusinessView({
  businessId,
  cityId,
  businessLocationId,
  trafficSource = 'DIRECT',
  searchQuery,
}: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void postOrganicAnalyticsEvent({
      type: 'VIEW_BUSINESS',
      businessId,
      ...(cityId ? { cityId } : {}),
      ...(businessLocationId ? { businessLocationId } : {}),
      trafficSource,
      discoverySurface: 'BUSINESS_DETAIL',
      ...(trafficSource === 'SEARCH' && searchQuery?.trim()
        ? { searchQuery: searchQuery.trim() }
        : {}),
    });
  }, [businessId, businessLocationId, cityId, searchQuery, trafficSource]);

  return null;
}
