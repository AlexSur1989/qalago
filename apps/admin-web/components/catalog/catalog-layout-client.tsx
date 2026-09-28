'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { adminApi, AuthUser, CityRow } from '@/lib/api';
import { canViewAdminCatalog } from '@/lib/admin-catalog-rbac';
import type { AdminCatalogLocale } from '@/lib/admin-catalog-labels';
import { adminCatalogLabel } from '@/lib/admin-catalog-labels';
import { useAuth } from '@/lib/use-auth';

const LOCALE_KEY = 'adminCatalogLocale';

type CatalogContextValue = {
  token: string;
  user: AuthUser;
  citySlug: string;
  cityLocked: boolean;
  locale: AdminCatalogLocale;
  setLocale: (l: AdminCatalogLocale) => void;
  cities: CityRow[];
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function useCatalogContext() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalogContext requires CatalogLayoutClient');
  return ctx;
}

export function CatalogLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, ready, logout } = useAuth();
  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [locale, setLocaleState] = useState<AdminCatalogLocale>('ru');
  const [pendingBadge, setPendingBadge] = useState(0);

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === 'kk' || stored === 'ru') setLocaleState(stored);
  }, []);

  function setLocale(l: AdminCatalogLocale) {
    setLocaleState(l);
    localStorage.setItem(LOCALE_KEY, l);
  }

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (!canViewAdminCatalog(user.role)) {
      router.replace('/login');
    }
  }, [ready, token, user, router]);

  useEffect(() => {
    if (!token) return;
    adminApi
      .listCitiesAdmin(token)
      .then(setCities)
      .catch(() => adminApi.listCities().then(setCities).catch(() => undefined));
  }, [token]);

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
      .then((res) => setPendingBadge(res.meta.total))
      .catch(() => undefined);
  }, [token, citySlug]);

  if (!ready || !token || !user) {
    return <p style={{ padding: 24 }}>{adminCatalogLabel(locale, 'loading')}</p>;
  }

  const activeTab = 'moderation' as const;

  return (
    <CatalogContext.Provider
      value={{ token, user, citySlug, cityLocked, locale, setLocale, cities }}
    >
      <AdminShell
        activeTab={activeTab}
        onTabChange={() => undefined}
        user={user}
        citySlug={citySlug}
        cities={cities}
        cityLocked={cityLocked}
        onCityChange={setCitySlug}
        badges={{ pending: pendingBadge, featured: 0, reviews: 0 }}
        onLogout={logout}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/catalog/businesses"
              className={pathname === '/catalog/businesses' ? 'tag tag-success' : 'tag tag-muted'}
            >
              {adminCatalogLabel(locale, 'navBusinesses')}
            </Link>
          </nav>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn btn-sm${locale === 'ru' ? ' btn-primary' : ' btn-ghost'}`}
              onClick={() => setLocale('ru')}
            >
              {adminCatalogLabel(locale, 'localeRu')}
            </button>
            <button
              type="button"
              className={`btn btn-sm${locale === 'kk' ? ' btn-primary' : ' btn-ghost'}`}
              onClick={() => setLocale('kk')}
            >
              {adminCatalogLabel(locale, 'localeKk')}
            </button>
          </div>
        </div>
        {children}
      </AdminShell>
    </CatalogContext.Provider>
  );
}
