'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { ModerationSubNav } from '@/components/moderation/moderation-subnav';
import { adminApi, AuthUser, CityRow } from '@/lib/api';
import { moderationApi } from '@/lib/moderation-api';
import { canAccessModerationConsole } from '@/lib/moderation-utils';
import { useAuth } from '@/lib/use-auth';

type ModerationContextValue = {
  token: string;
  user: AuthUser;
  citySlug: string;
  cityLocked: boolean;
};

const ModerationContext = createContext<ModerationContextValue | null>(null);

export function useModerationContext() {
  const ctx = useContext(ModerationContext);
  if (!ctx) {
    throw new Error('useModerationContext must be used within ModerationLayoutClient');
  }
  return ctx;
}

type ModerationLayoutClientProps = {
  children: ReactNode;
};

export function ModerationLayoutClient({ children }: ModerationLayoutClientProps) {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [pendingBusinesses, setPendingBusinesses] = useState(0);
  const [openCases, setOpenCases] = useState(0);

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (!canAccessModerationConsole(user.role)) {
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
    moderationApi
      .listCases(token, {
        status: 'OPEN',
        page: 1,
        limit: 1,
        citySlug: cityLocked ? undefined : citySlug,
      })
      .then((res) => setOpenCases(res.meta.total))
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
      moderationCaseBadge={openCases}
      onLogout={logout}
    >
      <div className="page-header">
        <div>
          <h1>Модерация UGC</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Жалобы пользователей и кейсы по контенту
          </p>
        </div>
      </div>
      <ModerationContext.Provider value={{ token, user, citySlug, cityLocked }}>
        <ModerationSubNav openCaseCount={openCases} />
        {children}
      </ModerationContext.Provider>
    </AdminShell>
  );
}
