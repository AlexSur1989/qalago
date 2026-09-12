'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { LegalSubNav } from '@/components/legal/legal-subnav';
import { adminApi, AuthUser, CityRow } from '@/lib/api';
import { legalApi } from '@/lib/legal-api';
import {
  canAccessGovernmentSecurity,
  canAccessLegalConsole,
} from '@/lib/legal-utils';
import { useAuth } from '@/lib/use-auth';

type LegalContextValue = {
  token: string;
  user: AuthUser;
};

const LegalContext = createContext<LegalContextValue | null>(null);

export function useLegalContext() {
  const ctx = useContext(LegalContext);
  if (!ctx) {
    throw new Error('useLegalContext must be used within LegalLayoutClient');
  }
  return ctx;
}

type LegalLayoutClientProps = {
  children: ReactNode;
};

export function LegalLayoutClient({ children }: LegalLayoutClientProps) {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [pendingBusinesses, setPendingBusinesses] = useState(0);
  const [pendingDataRequests, setPendingDataRequests] = useState(0);

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;
  const showSuperAdmin = user ? canAccessGovernmentSecurity(user.role) : false;

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (!canAccessLegalConsole(user.role)) {
      router.replace('/login');
    }
  }, [ready, token, user, router]);

  useEffect(() => {
    adminApi.listCities().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'CITY_ADMIN' && user.managedCity?.slug) {
      setCitySlug(user.managedCity.slug);
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    adminApi
      .listBusinesses(token, citySlug, 'PENDING', 1, 1)
      .then((res) => setPendingBusinesses(res.meta.total))
      .catch(() => undefined);
  }, [token, citySlug]);

  useEffect(() => {
    if (!token) return;
    legalApi
      .listDataRequests(token, { status: 'SUBMITTED', page: 1, limit: 1 })
      .then((res) => setPendingDataRequests(res.meta.total))
      .catch(() => undefined);
  }, [token]);

  if (!ready || !token || !user) {
    return <p className="page-content">Загрузка…</p>;
  }

  const cityLabel =
    user.managedCity?.nameRu ??
    cities.find((c) => c.slug === citySlug)?.nameRu ??
    citySlug;

  return (
    <AdminShell
      activeTab="moderation"
      onTabChange={() => router.push('/dashboard')}
      user={user}
      citySlug={citySlug}
      cities={cities.length > 0 ? cities : [{ slug: citySlug, nameRu: cityLabel }]}
      cityLocked={cityLocked}
      onCityChange={setCitySlug}
      badges={{
        pending: pendingBusinesses,
        featured: 0,
        reviews: 0,
      }}
      legalDataRequestBadge={pendingDataRequests}
      onLogout={logout}
    >
      <div className="page-header">
        <div>
          <h1>Legal &amp; compliance</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Документы, запросы субъектов данных и governance (Stage 6.9)
          </p>
        </div>
      </div>
      <LegalContext.Provider value={{ token, user }}>
        <LegalSubNav
          showSuperAdminSections={showSuperAdmin}
          pendingDataRequests={pendingDataRequests}
        />
        {children}
      </LegalContext.Provider>
    </AdminShell>
  );
}
