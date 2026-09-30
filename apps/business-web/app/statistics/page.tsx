'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnalyticsDashboard, ownerApi } from '@/lib/api';
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
import { Analytics360Dashboard } from '@/components/analytics-360-dashboard';
import { BusinessShell } from '@/components/business-shell';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { BUSINESS_ROUTE_ACCESS, useBusinessRouteGate } from '@/lib/use-business-route-gate';
import { BackofficeErrorState, BackofficeLoadingState } from '@qalago/brand/states';
import { statisticsPeriodDaysLabel } from '@/lib/owner-visual-copy';

export default function StatisticsPage() {
  const locale = useLocale();
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
  } = useBusinessRouteGate(BUSINESS_ROUTE_ACCESS.analytics);

  const [days, setDays] = useState(30);
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [promotionTitles, setPromotionTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token || !business || !routeAllowed) return;
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
      .catch((err) => setError(mapAnalyticsLoadError(locale, err)))
      .finally(() => setLoading(false));
  }, [token, business?.id, days, routeAllowed]);

  useEffect(() => {
    if (!token || !business || !routeAllowed || !dashboard?.promotions?.byPromotion?.length) {
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
  }, [token, business?.id, dashboard?.promotions?.byPromotion?.length, routeAllowed]);

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

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
      setError(mapAnalyticsExportError(locale, err));
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
      .catch((err) => setError(mapAnalyticsLoadError(locale, err)))
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
      {error ? (
        <BackofficeErrorState message={error} onRetry={handleRetry} retryLabel={ui.text_b914bb} />
      ) : null}

      {!business ? (
        <div className="empty-state">
          <h2>{ui.____447674}</h2>
          <p>{ui.____20204b}</p>
          <Link href="/onboarding" className="btn btn-primary" style={{ marginTop: 16 }}>{ui.___43fd9e}</Link>
        </div>
      ) : !routeAllowed ? (
        <BusinessSectionAccessDenied />
      ) : (
        <>
          <header className="page-header">
            <div>
              <h1>{ui.ownerNavAnalytics}</h1>
              <p className="page-header-meta">
                {formatTodayHeader(locale)} · {business.title}
              </p>
              {dashboard?.headline ? (
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{dashboard.headline}</p>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/monetization/campaigns" className="btn btn-ghost">{ui.__b8c6a7}</Link>
              <Link href="/dashboard" className="btn btn-ghost">{ui.text_76e286}</Link>
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
                {statisticsPeriodDaysLabel(locale, option)}
              </button>
            ))}
          </div>

          {loading && !dashboard ? (
            <BackofficeLoadingState density="page" label={ui.__bbd5d8} />
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
