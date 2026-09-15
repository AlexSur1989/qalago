'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import type { AnalyticsDashboard } from '@/lib/api';
import {
  actionMetricLabel,
  dashboardIsEmpty,
  formatMetricValue,
  formatPercent,
  formatRate,
  funnelSteps,
  intentActionEntries,
  isLockedSection,
  lockedSectionMessage,
  primaryUpgradeMessage,
} from '@/lib/analytics-utils';
import { formatNumber } from '@/lib/business-utils';
import { ViewsChart } from '@/components/views-chart';

function LockedCard({ label, message }: { label: string; message: string }) {
  const ui = useUi();
  return (
    <article className="card analytics-locked-card">
      <div className="card-header">
        <h2>{label}</h2>
        <span className="badge badge-muted">{ui.ownerNavPlan}</span>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{message}</p>
      <Link href="/plan" className="btn btn-primary btn-sm">{ui.__d94b6a}</Link>
    </article>
  );
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="analytics-section-title" style={{ marginTop: 28, marginBottom: 12 }}>
      {children}
    </h2>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </article>
  );
}

function HourBars({ items }: { items: Array<{ hour: number; count: number }> }) {
  const ui = useUi();
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div
      className="hour-bars"
      role="img"
      aria-label={ui.__badd65}
      style={{ display: 'flex', alignItems: 'flex-end', gap: 4, minHeight: 120, overflowX: 'auto' }}
    >
      {items.map((row) => (
        <div
          key={row.hour}
          style={{ flex: '1 0 12px', minWidth: 12, textAlign: 'center' }}
          title={`${row.hour}:00 — ${row.count}`}
        >
          <div
            style={{
              height: `${(row.count / max) * 100}px`,
              minHeight: row.count > 0 ? 4 : 0,
              background: 'var(--primary, #00A8D6)',
              borderRadius: 4,
            }}
          />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.hour}</span>
        </div>
      ))}
    </div>
  );
}

export type Analytics360DashboardProps = {
  dashboard: AnalyticsDashboard;
  days: number;
  canExport: boolean;
  exporting: boolean;
  onExport: () => void;
  promotionTitles?: Record<string, string>;
};

export function Analytics360Dashboard({
  dashboard,
  days,
  canExport,
  exporting,
  onExport,
  promotionTitles = {},
}: Analytics360DashboardProps) {
  const locale = useLocale();
  const ui = useUi();

  const upgrade = primaryUpgradeMessage(dashboard);
  const empty = dashboardIsEmpty(dashboard);
  const caps = dashboard.capabilities;
  const overview = dashboard.overview;

  if (empty) {
    return (
      <div className="empty-state">
        <h2>{ui.____de365b}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{ui.____93b52c}</p>
      </div>
    );
  }

  return (
    <>
      {upgrade ? (
        <article className="card" style={{ marginBottom: 16, borderColor: 'var(--primary-muted)' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{upgrade}</p>
          <Link href="/plan" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>{ui.__d94b6a}</Link>
        </article>
      ) : null}

      <div className="btn-row" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        {canExport ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={exporting}
            onClick={onExport}
          >
            {exporting ? ui.text_b5461e : ui._csv_bfd8aa}
          </button>
        ) : isLockedSection(dashboard, 'reportExport') ? (
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {lockedSectionMessage(dashboard, 'reportExport')}
          </span>
        ) : null}
        <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>
          Период: {dashboard.effectiveRange.days} дн.
        </span>
      </div>

      <SectionTitle id="overview">{ui.ownerNavOverview}</SectionTitle>
      <section className="kpi-grid">
        {formatMetricValue(overview.views) != null ? (
          <KpiTile label={ui.text_54b0a7} value={formatMetricValue(overview.views)!} />
        ) : null}
        {caps.impressions && formatMetricValue(overview.impressions) != null ? (
          <KpiTile label={ui.text_c25cef} value={formatMetricValue(overview.impressions)!} />
        ) : null}
        {dashboard.actions && formatMetricValue(dashboard.actions.total) != null ? (
          <KpiTile
            label={ui.__5ddc33}
            value={formatMetricValue(dashboard.actions.total)!}
          />
        ) : null}
        {caps.ctr && overview.ctr != null ? (
          <KpiTile label="CTR" value={formatRate(overview.ctr)} />
        ) : null}
        {caps.conversion && overview.conversionRate != null ? (
          <KpiTile label={ui.___a6b7f9} value={formatRate(overview.conversionRate)} />
        ) : null}
      </section>

      {dashboard.actions ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>{ui.____75174f}</h3>
          </div>
          <div className="kpi-grid">
            {intentActionEntries(dashboard.actions).map(({ key, value }) => (
              <KpiTile key={key} label={actionMetricLabel(locale, key)} value={formatNumber(value)} />
            ))}
          </div>
        </article>
      ) : isLockedSection(dashboard, 'actions') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.__5ddc33}
            message={lockedSectionMessage(dashboard, 'actions') ?? ui.____bd15ac}
          />
        </div>
      ) : null}

      <SectionTitle id="trends">{ui.text_e073be}</SectionTitle>
      <article className="card">
        <div className="card-header">
          <h3>Просмотры за {dashboard.effectiveRange.days} дн.</h3>
        </div>
        <ViewsChart items={dashboard.trends.views} days={dashboard.effectiveRange.days} />
      </article>
      {dashboard.trends.actions && caps.actionTrend ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>Целевые действия за {dashboard.effectiveRange.days} дн.</h3>
          </div>
          <ViewsChart items={dashboard.trends.actions} days={dashboard.effectiveRange.days} />
        </article>
      ) : null}

      {dashboard.comparison ? (
        <>
          <SectionTitle id="comparison">{ui.text_20857d}</SectionTitle>
          <article className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{ui.text_7ae745}</th>
                  <th>{ui.text_772843}</th>
                  <th>{ui.text_786af9}</th>
                  <th>{ui.text_858580}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.comparison.metrics.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>{formatNumber(row.current)}</td>
                    <td>{formatNumber(row.previous)}</td>
                    <td>{formatPercent(row.deltaPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </>
      ) : isLockedSection(dashboard, 'comparison') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.__fa3ac6}
            message={lockedSectionMessage(dashboard, 'comparison') ?? ui.____bd15ac}
          />
        </div>
      ) : null}

      <SectionTitle id="acquisition">{ui.text_66008b}</SectionTitle>
      {caps.trafficSources && dashboard.sources && dashboard.sources.length > 0 ? (
        <article className="card">
          <div className="card-header">
            <h3>{ui.__2add9a}</h3>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{ui.text_7a1120}</th>
                  <th>{ui.text_54b0a7}</th>
                  <th>{ui.text_64d5d6}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.sources.map((row) => (
                  <tr key={row.source}>
                    <td>{row.label}</td>
                    <td>{formatNumber(row.views)}</td>
                    <td>{row.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : isLockedSection(dashboard, 'sources') ? (
        <LockedCard
          label={ui.text_c2a996}
          message={lockedSectionMessage(dashboard, 'sources') ?? ui.__pro_7effee}
        />
      ) : caps.trafficSources ? (
        <article className="card">
          <p style={{ color: 'var(--text-muted)' }}>{ui.____969588}</p>
        </article>
      ) : null}

      {caps.searchQueries && dashboard.searchQueries && dashboard.searchQueries.length > 0 ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>{ui.___59bd6e}</h3>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{ui.text_67c7f6}</th>
                  <th>{ui.text_8d35fc}</th>
                  <th>{ui.text_64d5d6}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.searchQueries.map((row) => (
                  <tr key={row.query}>
                    <td>{row.query}</td>
                    <td>{formatNumber(row.count)}</td>
                    <td>{row.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : dashboard.searchQueriesStatus === 'INSUFFICIENT_DATA' ? (
        <article className="card" style={{ marginTop: 16 }}>
          <p style={{ color: 'var(--text-muted)' }}>{ui.____a54708}</p>
        </article>
      ) : isLockedSection(dashboard, 'searchQueries') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.__8c3081}
            message={lockedSectionMessage(dashboard, 'searchQueries') ?? ui.__pro_7effee}
          />
        </div>
      ) : null}

      {caps.ctr && funnelSteps(locale, dashboard).length >= 2 ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>{ui.text_funnelAggregateTitle}</h3>
          </div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {funnelSteps(locale, dashboard).map((step, i, arr) => (
              <li key={step.label} style={{ marginBottom: 8 }}>
                {step.label}: <strong>{formatNumber(step.value ?? 0)}</strong>
                {i < arr.length - 1 ? <span aria-hidden> ↓</span> : null}
              </li>
            ))}
          </ol>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>{ui.____88eb85}</p>
          {overview.ctr != null ? (
            <p>CTR (просмотры / показы): {formatRate(overview.ctr)}</p>
          ) : null}
          {overview.conversionRate != null ? (
            <p>Конверсия (действия / просмотры): {formatRate(overview.conversionRate)}</p>
          ) : null}
        </article>
      ) : isLockedSection(dashboard, 'ctr') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.ctr___69b910}
            message={lockedSectionMessage(dashboard, 'ctr') ?? ui.__pro_7effee}
          />
        </div>
      ) : null}

      <SectionTitle id="audience">{ui.text_b14e2a}</SectionTitle>
      {dashboard.audience && caps.audience ? (
        <article className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{ui.____7d54b1}</p>
          <div className="kpi-grid" style={{ marginTop: 12 }}>
            <KpiTile
              label={ui.____734d85}
              value={formatRate(dashboard.audience.newShare)}
            />
            <KpiTile
              label={ui.___31acc4}
              value={formatRate(dashboard.audience.returningShare)}
            />
          </div>
        </article>
      ) : isLockedSection(dashboard, 'audience') ? (
        <LockedCard
          label={ui.___a13f56}
          message={lockedSectionMessage(dashboard, 'audience') ?? ui.__vip_111d64}
        />
      ) : null}

      {caps.visitorMetrics ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>{ui.___181b32}</h3>
          </div>
          {overview.uniqueVisitorsPeriodDistinct != null ? (
            <p>
              Уникальные посетители (за период):{' '}
              <strong>{formatNumber(overview.uniqueVisitorsPeriodDistinct)}</strong>
            </p>
          ) : overview.uniqueVisitorsDailySumApprox != null ? (
            <p>
              Уникальные посетители (сумма по дням, приближение):{' '}
              <strong>{formatNumber(overview.uniqueVisitorsDailySumApprox)}</strong>
            </p>
          ) : null}
          {overview.sessionsPeriodDistinct != null ? (
            <p>
              Сессии (за период): <strong>{formatNumber(overview.sessionsPeriodDistinct)}</strong>
            </p>
          ) : overview.sessionsDailySumApprox != null ? (
            <p>
              Сессии (сумма по дням, приближение):{' '}
              <strong>{formatNumber(overview.sessionsDailySumApprox)}</strong>
            </p>
          ) : null}
        </article>
      ) : null}

      {dashboard.audienceGeography && dashboard.audienceGeography.length > 0 ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>{ui.text_geoDistanceTitle}</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{ui.____60557b}</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>{ui.text_b7697b}</th>
                <th>{ui.text_54b0a7}</th>
                <th>{ui.text_64d5d6}</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.audienceGeography.map((row) => (
                <tr key={row.bucket}>
                  <td>{row.label}</td>
                  <td>{formatNumber(row.count)}</td>
                  <td>{row.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ) : dashboard.audienceGeographyStatus === 'INSUFFICIENT_DATA' ? (
        <article className="card" style={{ marginTop: 16 }}>
          <p style={{ color: 'var(--text-muted)' }}>{ui.____8e7898}</p>
        </article>
      ) : isLockedSection(dashboard, 'audienceGeography') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.text_79b6dc}
            message={lockedSectionMessage(dashboard, 'audienceGeography') ?? ui.__vip_111d64}
          />
        </div>
      ) : null}

      {dashboard.popularTimes?.byHour && caps.popularTimes ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>{ui.__badd65}</h3>
          </div>
          <HourBars items={dashboard.popularTimes.byHour} />
        </article>
      ) : isLockedSection(dashboard, 'popularTimes') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.__badd65}
            message={lockedSectionMessage(dashboard, 'popularTimes') ?? ui.__vip_111d64}
          />
        </div>
      ) : null}

      <SectionTitle id="content">{ui.text_480107}</SectionTitle>
      {dashboard.promotions && caps.promotionAnalytics ? (
        <article className="card">
          <div className="card-header">
            <h3>{ui.ownerMgmtPromotions}</h3>
          </div>
          <p>{ui.__3a1b5c}<strong>{formatNumber(dashboard.promotions.promotionViews)}</strong>
          </p>
          {dashboard.promotions.byPromotion && caps.promotionBreakdown ? (
            <table className="data-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>{ui.text_df0d49}</th>
                  <th>{ui.text_54b0a7}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.promotions.byPromotion.map((row) => (
                  <tr key={row.promotionId}>
                    <td>{promotionTitles[row.promotionId] ?? ui.text_5a65ee}</td>
                    <td>{formatNumber(row.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {dashboard.promotions.actionsAvailable === false ? (
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{ui.____c09e09}</p>
          ) : null}
        </article>
      ) : isLockedSection(dashboard, 'promotions') ? (
        <LockedCard
          label={ui.ownerMgmtPromotions}
          message={lockedSectionMessage(dashboard, 'promotions') ?? ui.____bd15ac}
        />
      ) : null}

      {dashboard.catalog && caps.catalogAnalytics ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>{ui.text_ad5122}</h3>
          </div>
          {dashboard.catalog.items.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{ui.__a4efab}</th>
                  <th>{ui.text_54b0a7}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.catalog.items.map((row) => (
                  <tr key={row.catalogItemId}>
                    <td>{row.catalogItemId.slice(0, 10)}…</td>
                    <td>{formatNumber(row.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>{ui.____fdc143}</p>
          )}
          {dashboard.catalog.actionsAvailable === false ? (
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{ui.____7c04ae}</p>
          ) : null}
        </article>
      ) : isLockedSection(dashboard, 'catalog') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.text_ad5122}
            message={lockedSectionMessage(dashboard, 'catalog') ?? ui.__vip_111d64}
          />
        </div>
      ) : null}

      {dashboard.benchmark ? (
        <>
          <SectionTitle id="benchmark">{ui.___f2125d}</SectionTitle>
          <article className="card">
            <div className="card-header">
              <h3>{dashboard.benchmark.categoryTitle}</h3>
            </div>
            {dashboard.benchmark.status === 'INSUFFICIENT_DATA' ? (
              <p style={{ color: 'var(--text-muted)' }}>
                {dashboard.benchmark.message ?? ui.____4c8273}
              </p>
            ) : (
              <>
                <p>
                  Просмотры: {formatNumber(dashboard.benchmark.businessViews ?? 0)} vs среднее{' '}
                  {formatNumber(dashboard.benchmark.categoryAvgViews ?? 0)}
                </p>
                <p>
                  Действия: {formatNumber(dashboard.benchmark.businessActions ?? 0)} vs среднее{' '}
                  {formatNumber(dashboard.benchmark.categoryAvgActions ?? 0)}
                </p>
              </>
            )}
          </article>
        </>
      ) : isLockedSection(dashboard, 'benchmark') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.___f2125d}
            message={lockedSectionMessage(dashboard, 'benchmark') ?? ui.__vip_111d64}
          />
        </div>
      ) : null}

      {dashboard.recommendations && dashboard.recommendations.length > 0 ? (
        <>
          <SectionTitle id="recommendations">{ui.text_558e9d}</SectionTitle>
          {dashboard.recommendations.map((item) => (
            <article key={item.id} className="card" style={{ marginBottom: 8 }}>
              <h3>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{item.body}</p>
            </article>
          ))}
        </>
      ) : isLockedSection(dashboard, 'recommendations') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label={ui.text_558e9d}
            message={lockedSectionMessage(dashboard, 'recommendations') ?? ui.__vip_111d64}
          />
        </div>
      ) : null}
    </>
  );
}
