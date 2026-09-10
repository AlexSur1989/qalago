'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AnalyticsDashboard,
  findMyBusinessItem,
  myBusinessRows,
  ownerApi,
} from '@/lib/api';
import {
  availablePeriodOptions,
  canShowExport,
  mapAnalyticsExportError,
  mapAnalyticsLoadError,
  normalizeAnalyticsDashboard,
  syncPeriodToEffectiveRange,
} from '@/lib/analytics-utils';
import {
  BusinessPermission,
  hasPermission,
  isOwner,
} from '@/lib/business-access';
import { formatTodayHeader } from '@/lib/business-utils';
import { useAuth } from '@/lib/use-auth';
import { Analytics360Dashboard } from '@/components/analytics-360-dashboard';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';

export default function StatisticsPage() {
  const { token, user, items, ready, logout } = useAuth();
  const businesses = useMemo(() => myBusinessRows(items), [items]);
  const business = useSelectedBusiness(businesses);
  const accessItem = business ? findMyBusinessItem(items, business.id) : null;
  const access = accessItem?.access ?? null;

  const [days, setDays] = useState(30);
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [promotionTitles, setPromotionTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token || !business) return;
    setLoading(true);
    ownerApi
      .analyticsDashboard(token, business.id, days)
      .then((data) => {
        const normalized = normalizeAnalyticsDashboard(data);
        setDashboard(normalized);
        const effective = syncPeriodToEffectiveRange(days, normalized);
        if (effective !== days) setDays(effective);
        setError(null);
      })
      .catch((err) => setError(mapAnalyticsLoadError(err)))
      .finally(() => setLoading(false));
  }, [token, business?.id, days]);

  useEffect(() => {
    if (!token || !business || !dashboard?.promotions?.byPromotion?.length) {
      setPromotionTitles({});
      return;
    }
    ownerApi
      .listPromotions(token, business.id)
      .then((res) => {
        const map: Record<string, string> = {};
        for (const p of res.items) map[p.id] = p.title;
        setPromotionTitles(map);
      })
      .catch(() => setPromotionTitles({}));
  }, [token, business?.id, dashboard?.promotions?.byPromotion?.length]);

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  const periodOptions = dashboard
    ? availablePeriodOptions(dashboard.capabilities.maxDays)
    : [7, 30];

  const hasExportPermission =
    isOwner(access) || hasPermission(access, BusinessPermission.ANALYTICS_EXPORT);
  const exportAllowed = dashboard ? canShowExport(dashboard, hasExportPermission) : false;

  async function handleExport() {
    if (!token || !business || exporting || !exportAllowed) return;
    setExporting(true);
    setError(null);
    try {
      await ownerApi.downloadAnalyticsExport(token, business.id, days);
    } catch (err) {
      setError(mapAnalyticsExportError(err));
    } finally {
      setExporting(false);
    }
  }

  function handleRetry() {
    if (!token || !business) return;
    setLoading(true);
    ownerApi
      .analyticsDashboard(token, business.id, days)
      .then((data) => {
        setDashboard(normalizeAnalyticsDashboard(data));
        setError(null);
      })
      .catch((err) => setError(mapAnalyticsLoadError(err)))
      .finally(() => setLoading(false));
  }

  return (
    <BusinessShell
      activeNav="stats"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={handleRetry}>
            Повторить
          </button>
        </div>
      )}

      {!business ? (
        <div className="empty-state">
          <h2>У вас пока нет бизнеса в QalaGo</h2>
          <p>Добавьте или найдите бизнес, чтобы видеть статистику.</p>
          <Link href="/onboarding" className="btn btn-primary" style={{ marginTop: 16 }}>
            Перейти к онбордингу
          </Link>
        </div>
      ) : (
        <>
          <header className="page-header">
            <div>
              <h1>Статистика</h1>
              <p className="page-header-meta">
                {formatTodayHeader()} · {business.title}
              </p>
              {dashboard?.headline ? (
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{dashboard.headline}</p>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/monetization/campaigns" className="btn btn-ghost">
                Статистика рекламы →
              </Link>
              <Link href="/dashboard" className="btn btn-ghost">
                ← Обзор
              </Link>
            </div>
          </header>

          <div className="btn-row" style={{ marginBottom: 16 }}>
            {periodOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`btn ${days === option ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDays(option)}
              >
                {option} дн
              </button>
            ))}
          </div>

          {loading && !dashboard ? (
            <p role="status">Загрузка статистики…</p>
          ) : dashboard ? (
            <Analytics360Dashboard
              dashboard={dashboard}
              days={days}
              canExport={exportAllowed}
              exporting={exporting}
              onExport={handleExport}
              promotionTitles={promotionTitles}
            />
          ) : null}
        </>
      )}
    </BusinessShell>
  );
}
