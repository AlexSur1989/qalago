'use client';

import { useEffect, useState } from 'react';
import {
  BusinessAccessInfo,
  BusinessRow,
  MyBusinessItem,
  SELECTED_BUSINESS_KEY,
} from '@/lib/api';
import { useAuth } from '@/lib/use-auth';

export function useBusinessAccess() {
  const { token, user, items, ready, logout } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }
    const stored = localStorage.getItem(SELECTED_BUSINESS_KEY);
    const match = items.find((item) => item.business.id === stored);
    const id = match?.business.id ?? items[0].business.id;
    localStorage.setItem(SELECTED_BUSINESS_KEY, id);
    setSelectedId(id);
  }, [items]);

  const selectedItem: MyBusinessItem | null =
    items.find((item) => item.business.id === selectedId) ?? items[0] ?? null;

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
  };
}
