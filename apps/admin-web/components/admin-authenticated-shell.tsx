'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { AdminTabId } from '@/lib/admin-utils';
import { adminApi, CityRow } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { canAccessAdminWeb } from '@/lib/rbac';
import type { MonetizationSubNavId } from '@/lib/monetization-utils';

type AdminAuthenticatedShellProps = {
  children: ReactNode;
  activeTab?: AdminTabId;
  onTabChange?: (tab: AdminTabId) => void;
  monetizationBadges?: Partial<Record<MonetizationSubNavId, number>>;
  businessRequestBadges?: { applications?: number; claims?: number };
  moderationCaseBadge?: number;
  legalDataRequestBadge?: number;
  loadPendingBadge?: boolean;
};

export function AdminAuthenticatedShell({
  children,
  activeTab = 'moderation',
  onTabChange,
  monetizationBadges,
  businessRequestBadges,
  moderationCaseBadge,
  legalDataRequestBadge,
  loadPendingBadge = true,
}: AdminAuthenticatedShellProps) {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [pendingBadge, setPendingBadge] = useState(0);

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;

  useEffect(() => {
    if (!ready) return;
    if (!user || !canAccessAdminWeb(user.role)) {
      router.replace('/login');
    }
  }, [ready, user, router]);

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
    if (!token || !loadPendingBadge) return;
    adminApi
      .listBusinesses(token, citySlug, 'PENDING', 1, 1)
      .then((res) => setPendingBadge(res.meta.total))
      .catch(() => undefined);
  }, [token, citySlug, loadPendingBadge]);

  if (!ready || !token || !user) {
    return <p className="page-content muted">Загрузка…</p>;
  }

  const cityLabel =
    user.managedCity?.nameRu ??
    cities.find((c) => c.slug === citySlug)?.nameRu ??
    citySlug;

  const handleTabChange =
    onTabChange ??
    ((tab: AdminTabId) => {
      if (tab === 'monetization') {
        router.push('/monetization');
        return;
      }
      router.push('/dashboard');
    });

  return (
    <AdminShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      user={user}
      citySlug={citySlug}
      cities={cities.length > 0 ? cities : [{ slug: citySlug, nameRu: cityLabel }]}
      cityLocked={cityLocked}
      onCityChange={setCitySlug}
      badges={{
        pending: pendingBadge,
        featured: 0,
        reviews: 0,
      }}
      onLogout={logout}
      monetizationBadges={monetizationBadges}
      businessRequestBadges={businessRequestBadges}
      moderationCaseBadge={moderationCaseBadge}
      legalDataRequestBadge={legalDataRequestBadge}
    >
      {children}
    </AdminShell>
  );
}
