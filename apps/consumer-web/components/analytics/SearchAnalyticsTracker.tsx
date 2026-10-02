'use client';

import { useEffect, useRef } from 'react';
import { postOrganicAnalyticsEvent } from '@/lib/analytics-client';

export function SearchAnalyticsTracker({
  cityId,
  searchQuery,
  resultsCount,
}: {
  cityId: string;
  searchQuery: string;
  resultsCount: number;
}) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${cityId}:${searchQuery}:${resultsCount}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    void postOrganicAnalyticsEvent({
      type: 'SEARCH_PERFORMED',
      cityId,
      searchQuery,
    });
  }, [cityId, resultsCount, searchQuery]);

  return null;
}
