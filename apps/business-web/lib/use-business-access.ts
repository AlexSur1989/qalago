'use client';

import { useEffect, useMemo } from 'react';
import { BusinessAccessInfo, BusinessRow, MyBusinessItem } from '@/lib/api';
import {
  resolveSelectedMyBusinessItemWhenReady,
  syncSelectedBusinessStorageForMyItems,
} from '@/lib/business-selection';
import { useAuth } from '@/lib/use-auth';

export function useBusinessAccess() {
  const { token, user, items, ready, logout, refreshBusinesses } = useAuth();

  const selectedItem: MyBusinessItem | null = useMemo(
    () => resolveSelectedMyBusinessItemWhenReady(ready, items),
    [ready, items],
  );

  useEffect(() => {
    syncSelectedBusinessStorageForMyItems(ready, items);
  }, [ready, items]);

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
