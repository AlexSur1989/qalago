'use client';

import { ReactNode, createContext, useContext } from 'react';
import { BusinessAccessInfo, BusinessRow, findMyBusinessItem } from '@/lib/api';
import { useBusinessAccess } from '@/lib/use-business-access';
import { BusinessShell } from '@/components/business-shell';
import { MonetizationSubNav } from '@/components/monetization/monetization-subnav';

type MonetizationContextValue = {
  token: string;
  business: BusinessRow;
  businesses: BusinessRow[];
  access: BusinessAccessInfo | null;
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
  const { token, user, ready, logout, business, businesses, items } = useBusinessAccess();
  const access: BusinessAccessInfo | null = business
    ? findMyBusinessItem(items, business.id)?.access ?? null
    : null;

  if (!ready || !token) {
    return <p className="page-content">Загрузка…</p>;
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
        <div className="empty-state">
          <p>У вас пока нет бизнеса в QalaGo.</p>
          <a href="/onboarding" className="btn btn-primary">
            Добавить или найти бизнес
          </a>
        </div>
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
      <MonetizationContext.Provider value={{ token, business, businesses, access }}>
        <MonetizationSubNav />
        {children}
      </MonetizationContext.Provider>
    </BusinessShell>
  );
}
