'use client';

import { useUi } from '@/components/locale-provider';
import { ReactNode, createContext, useContext } from 'react';
import { BusinessAccessInfo, BusinessRow } from '@/lib/api';
import { BusinessShell } from '@/components/business-shell';
import { MonetizationSubNav } from '@/components/monetization/monetization-subnav';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { BUSINESS_ROUTE_ACCESS, useBusinessRouteGate } from '@/lib/use-business-route-gate';

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
  const ui = useUi();
  const {
    token,
    user,
    ready,
    logout,
    business,
    businesses,
    access,
    allowed: routeAllowed,
  } = useBusinessRouteGate(BUSINESS_ROUTE_ACCESS.ads);

  if (!ready || !token) {
    return <p className="page-content">{ui.text_89d69a}</p>;
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
          <p>{ui.____8f45fb}</p>
          <a href="/onboarding" className="btn btn-primary">{ui.____3f2e2a}</a>
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
      {!routeAllowed ? (
        <BusinessSectionAccessDenied />
      ) : (
        <MonetizationContext.Provider value={{ token, business, businesses, access }}>
          <MonetizationSubNav />
          {children}
        </MonetizationContext.Provider>
      )}
    </BusinessShell>
  );
}
