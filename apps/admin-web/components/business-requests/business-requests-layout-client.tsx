'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuthUser, CityRow } from '@/lib/api';
import { businessRequestsApi } from '@/lib/business-requests-api';
import { AdminShell } from '@/components/admin-shell';
import { BusinessRequestsSubNav } from '@/components/business-requests/business-requests-subnav';
import { canAccessBusinessRequests } from '@/lib/business-requests-utils';
import { useAuth } from '@/lib/use-auth';
import type { BusinessRequestsSubNavId } from '@/lib/business-requests-utils';

type BusinessRequestsContextValue = {
  token: string;
  user: AuthUser;
  citySlug: string;
  cityLocked: boolean;
};

const BusinessRequestsContext = createContext<BusinessRequestsContextValue | null>(null);

export function useBusinessRequestsContext() {
  const ctx = useContext(BusinessRequestsContext);
  if (!ctx) {
    throw new Error('useBusinessRequestsContext must be used within BusinessRequestsLayoutClient');
  }
  return ctx;
}

type BusinessRequestsLayoutClientProps = {
  children: ReactNode;
};

export function BusinessRequestsLayoutClient({ children }: BusinessRequestsLayoutClientProps) {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [pendingBusinesses, setPendingBusinesses] = useState(0);
  const [badges, setBadges] = useState<Partial<Record<BusinessRequestsSubNavId, number>>>({});

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (!canAccessBusinessRequests(user.role)) {
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
    const cityParam = cityLocked ? undefined : citySlug;
    Promise.all([
      businessRequestsApi.listApplications(token, {
        status: 'PENDING',
        page: 1,
        limit: 1,
        citySlug: cityParam,
      }),
      businessRequestsApi.listClaims(token, {
        status: 'PENDING',
        page: 1,
        limit: 1,
        citySlug: cityParam,
      }),
    ])
      .then(([apps, claims]) => {
        setBadges({
          applications: apps.meta.total,
          claims: claims.meta.total,
        });
      })
      .catch(() => undefined);
  }, [token, citySlug, cityLocked]);

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
      onTabChange={(tab) => {
        router.push('/dashboard');
      }}
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
      businessRequestBadges={badges}
      onLogout={logout}
    >
      <div className="page-header">
        <div>
          <h1>Заявки бизнеса</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Модерация новых бизнесов и подтверждение прав владельца
          </p>
        </div>
      </div>
      <BusinessRequestsContext.Provider
        value={{ token, user, citySlug, cityLocked }}
      >
        <BusinessRequestsSubNav badges={badges} />
        {children}
      </BusinessRequestsContext.Provider>
    </AdminShell>
  );
}
