'use client';

import { useEffect, useState } from 'react';
import { BusinessRow, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';

export function useOwnerBusiness(businessId: string) {
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    ownerApi
      .listMyBusinesses(token)
      .then(setBusinesses)
      .catch((err) => setError(String(err)));
  }, [token]);

  const business = businesses.find((b) => b.id === businessId) ?? null;

  async function reloadBusinesses() {
    if (!token) return;
    const items = await ownerApi.listMyBusinesses(token);
    setBusinesses(items);
  }

  return {
    token,
    user,
    ready,
    logout,
    businesses,
    business,
    error,
    setError,
    reloadBusinesses,
  };
}
