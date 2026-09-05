'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, CityRow } from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';
import { MonetizationSubNav } from '@/components/monetization/monetization-subnav';
import { useAuth } from '@/lib/use-auth';
import type { MonetizationSubNavId } from '@/lib/monetization-utils';

type MonetizationCityContextValue = {
  citySlug: string;
  setCitySlug: (slug: string) => void;
  token: string;
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
};

const MonetizationCityContext = createContext<MonetizationCityContextValue | null>(null);

export function useMonetizationContext() {
  const ctx = useContext(MonetizationCityContext);
  if (!ctx) {
    throw new Error('useMonetizationContext must be used within MonetizationLayoutClient');
  }
  return ctx;
}

type MonetizationLayoutClientProps = {
  children: ReactNode;
  badges?: Partial<Record<MonetizationSubNavId, number>>;
};

export function MonetizationLayoutClient({ children, badges }: MonetizationLayoutClientProps) {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;

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
      .then((res) => setPendingCount(res.meta.total))
      .catch(() => undefined);
  }, [token, citySlug]);

  if (!ready || !token || !user) {
    return <p className="page-content">Загрузка…</p>;
  }

  const cityLabel =
    user.managedCity?.nameRu ??
    cities.find((c) => c.slug === citySlug)?.nameRu ??
    citySlug;

  return (
    <AdminShell
      activeTab="monetization"
      onTabChange={(tab) => {
        if (tab === 'monetization') return;
        router.push('/dashboard');
      }}
      user={user}
      citySlug={citySlug}
      cities={cities.length > 0 ? cities : [{ slug: citySlug, nameRu: cityLabel }]}
      cityLocked={cityLocked}
      onCityChange={setCitySlug}
      badges={{
        pending: pendingCount,
        featured: 0,
        reviews: 0,
      }}
      onLogout={logout}
      monetizationBadges={badges}
    >
      <MonetizationCityContext.Provider
        value={{ citySlug, setCitySlug, token, user }}
      >
        <MonetizationSubNav badges={badges} />
        {children}
      </MonetizationCityContext.Provider>
    </AdminShell>
  );
}
