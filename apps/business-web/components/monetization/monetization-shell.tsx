'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { BusinessRow, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';
import { MonetizationSubNav } from '@/components/monetization/monetization-subnav';

type MonetizationContextValue = {
  token: string;
  business: BusinessRow;
  businesses: BusinessRow[];
};

const MonetizationContext = createContext<MonetizationContextValue | null>(null);

export function useMonetizationContext() {
  const ctx = useContext(MonetizationContext);
  if (!ctx) {
    throw new Error('useMonetizationContext must be used within MonetizationShell');
  }
  return ctx;
}

type MonetizationShellProps = {
  children: ReactNode;
};

export function MonetizationShell({ children }: MonetizationShellProps) {
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const business = useSelectedBusiness(businesses);

  useEffect(() => {
    if (!token) return;
    ownerApi
      .listMyBusinesses(token)
      .then(setBusinesses)
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!ready || !token) {
    return <p className="page-content">Загрузка…</p>;
  }

  if (loading) {
    return <p className="page-content">Загрузка заведений…</p>;
  }

  if (!business) {
    return (
      <BusinessShell
        activeNav="monetization"
        business={null}
        businesses={[]}
        userName={user?.name ?? user?.phone ?? undefined}
        onLogout={logout}
      >
        <div className="alert">Сначала добавьте заведение в кабинете.</div>
      </BusinessShell>
    );
  }

  return (
    <BusinessShell
      activeNav="monetization"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <MonetizationContext.Provider value={{ token, business, businesses }}>
        <MonetizationSubNav />
        {children}
      </MonetizationContext.Provider>
    </BusinessShell>
  );
}
