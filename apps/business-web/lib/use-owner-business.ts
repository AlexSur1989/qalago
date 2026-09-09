'use client';

import { useEffect, useState } from 'react';
import { BusinessRow, MyBusinessItem, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';

export function useOwnerBusiness(businessId: string) {
  const { token, user, ready, logout, items } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusinesses(items.map((item) => item.business));
  }, [items]);

  const business = businesses.find((b) => b.id === businessId) ?? null;
  const access = items.find((item) => item.business.id === businessId)?.access ?? null;

  async function reloadBusinesses() {
    if (!token) return;
    const res = await ownerApi.listMyBusinesses(token);
    setBusinesses(res.items.map((item: MyBusinessItem) => item.business));
  }

  return {
    token,
    user,
    ready,
    logout,
    businesses,
    business,
    access,
    error,
    setError,
    reloadBusinesses,
  };
}
