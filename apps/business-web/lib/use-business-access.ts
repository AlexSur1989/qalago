'use client';

import { useEffect, useMemo } from 'react';
import {
  BusinessAccessInfo,
  BusinessRow,
  MyBusinessItem,
  SELECTED_BUSINESS_KEY,
} from '@/lib/api';
import {
  readStoredSelectedBusinessId,
  resolveSelectedBusinessId,
  resolveSelectedMyBusinessItem,
} from '@/lib/business-selection';
import { useAuth } from '@/lib/use-auth';

export function useBusinessAccess() {
  const { token, user, items, ready, logout, refreshBusinesses } = useAuth();

  const selectedItem: MyBusinessItem | null = useMemo(
    () => resolveSelectedMyBusinessItem(items, readStoredSelectedBusinessId()),
    [items],
  );

  useEffect(() => {
    if (items.length === 0) {
      localStorage.removeItem(SELECTED_BUSINESS_KEY);
      return;
    }
    const id = resolveSelectedBusinessId(items, readStoredSelectedBusinessId());
    if (id) {
      localStorage.setItem(SELECTED_BUSINESS_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_BUSINESS_KEY);
    }
  }, [items]);

  const business: BusinessRow | null = selectedItem?.business ?? null;
  const access: BusinessAccessInfo | null = selectedItem?.access ?? null;
  const businesses = items.map((item) => item.business);

  return {
    token,
    user,
    ready,
    logout,
    items,
    businesses,
    business,
    access,
    selectedId: business?.id ?? null,
    refreshBusinesses,
  };
}
