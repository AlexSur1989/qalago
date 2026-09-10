'use client';

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
  return (
    <article className="card analytics-locked-card">
      <div className="card-header">
        <h2>{label}</h2>
        <span className="badge badge-muted">Тариф</span>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{message}</p>
      <Link href="/plan" className="btn btn-primary btn-sm">
        Посмотреть тарифы
      </Link>
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
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div
      className="hour-bars"
      role="img"
      aria-label="Популярные часы"
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
  const upgrade = primaryUpgradeMessage(dashboard);
  const empty = dashboardIsEmpty(dashboard);
  const caps = dashboard.capabilities;
  const overview = dashboard.overview;

  if (empty) {
    return (
      <div className="empty-state">
        <h2>Статистика появится после первых просмотров карточки</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Когда пользователи начнут открывать вашу карточку в QalaGo, здесь появятся просмотры и
          другие метрики.
        </p>
      </div>
    );
  }

  return (
    <>
      {upgrade ? (
        <article className="card" style={{ marginBottom: 16, borderColor: 'var(--primary-muted)' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{upgrade}</p>
          <Link href="/plan" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
            Посмотреть тарифы
          </Link>
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
            {exporting ? 'Формирование…' : 'Экспорт CSV'}
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

      <SectionTitle id="overview">Обзор</SectionTitle>
      <section className="kpi-grid">
        {formatMetricValue(overview.views) != null ? (
          <KpiTile label="Просмотры" value={formatMetricValue(overview.views)!} />
        ) : null}
        {caps.impressions && formatMetricValue(overview.impressions) != null ? (
          <KpiTile label="Показы" value={formatMetricValue(overview.impressions)!} />
        ) : null}
        {dashboard.actions && formatMetricValue(dashboard.actions.total) != null ? (
          <KpiTile
            label="Целевые действия"
            value={formatMetricValue(dashboard.actions.total)!}
          />
        ) : null}
        {caps.ctr && overview.ctr != null ? (
          <KpiTile label="CTR" value={formatRate(overview.ctr)} />
        ) : null}
        {caps.conversion && overview.conversionRate != null ? (
          <KpiTile label="Конверсия в действие" value={formatRate(overview.conversionRate)} />
        ) : null}
      </section>

      {dashboard.actions ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>Целевые действия по типам</h3>
          </div>
          <div className="kpi-grid">
            {intentActionEntries(dashboard.actions).map(({ key, value }) => (
              <KpiTile key={key} label={actionMetricLabel(key)} value={formatNumber(value)} />
            ))}
          </div>
        </article>
      ) : isLockedSection(dashboard, 'actions') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label="Целевые действия"
            message={lockedSectionMessage(dashboard, 'actions') ?? 'Доступно с тарифа Бизнес'}
          />
        </div>
      ) : null}

      <SectionTitle id="trends">Динамика</SectionTitle>
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
          <SectionTitle id="comparison">Сравнение</SectionTitle>
          <article className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Метрика</th>
                  <th>Текущий</th>
                  <th>Предыдущий</th>
                  <th>Изменение</th>
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
            label="Сравнение периодов"
            message={lockedSectionMessage(dashboard, 'comparison') ?? 'Доступно с тарифа Бизнес'}
          />
        </div>
      ) : null}

      <SectionTitle id="acquisition">Привлечение</SectionTitle>
      {caps.trafficSources && dashboard.sources && dashboard.sources.length > 0 ? (
        <article className="card">
          <div className="card-header">
            <h3>Источники просмотров</h3>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Источник</th>
                  <th>Просмотры</th>
                  <th>Доля</th>
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
          label="Источники"
          message={lockedSectionMessage(dashboard, 'sources') ?? 'Доступно с PRO'}
        />
      ) : caps.trafficSources ? (
        <article className="card">
          <p style={{ color: 'var(--text-muted)' }}>Недостаточно данных по источникам</p>
        </article>
      ) : null}

      {caps.searchQueries && dashboard.searchQueries && dashboard.searchQueries.length > 0 ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>Что ищут пользователи</h3>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Запрос</th>
                  <th>Переходов</th>
                  <th>Доля</th>
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
          <p style={{ color: 'var(--text-muted)' }}>Недостаточно данных по поисковым запросам</p>
        </article>
      ) : isLockedSection(dashboard, 'searchQueries') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label="Поисковые запросы"
            message={lockedSectionMessage(dashboard, 'searchQueries') ?? 'Доступно с PRO'}
          />
        </div>
      ) : null}

      {caps.ctr && funnelSteps(dashboard).length >= 2 ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>Воронка (агрегат периода)</h3>
          </div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {funnelSteps(dashboard).map((step, i, arr) => (
              <li key={step.label} style={{ marginBottom: 8 }}>
                {step.label}: <strong>{formatNumber(step.value ?? 0)}</strong>
                {i < arr.length - 1 ? <span aria-hidden> ↓</span> : null}
              </li>
            ))}
          </ol>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
            Показатели рассчитаны по агрегированным данным периода.
          </p>
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
            label="CTR и воронка"
            message={lockedSectionMessage(dashboard, 'ctr') ?? 'Доступно с PRO'}
          />
        </div>
      ) : null}

      <SectionTitle id="audience">Аудитория</SectionTitle>
      {dashboard.audience && caps.audience ? (
        <article className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Доли классифицированных просмотров, не уникальные люди.
          </p>
          <div className="kpi-grid" style={{ marginTop: 12 }}>
            <KpiTile
              label="Новые посетители — доля просмотров"
              value={formatRate(dashboard.audience.newShare)}
            />
            <KpiTile
              label="Вернувшиеся — доля просмотров"
              value={formatRate(dashboard.audience.returningShare)}
            />
          </div>
        </article>
      ) : isLockedSection(dashboard, 'audience') ? (
        <LockedCard
          label="Новые и вернувшиеся"
          message={lockedSectionMessage(dashboard, 'audience') ?? 'Доступно с VIP'}
        />
      ) : null}

      {caps.visitorMetrics ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>Посетители и сессии</h3>
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
            <h3>География (расстояние)</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Агрегированные корзины расстояния, без точной карты.
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Корзина</th>
                <th>Просмотры</th>
                <th>Доля</th>
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
          <p style={{ color: 'var(--text-muted)' }}>Недостаточно данных по географии</p>
        </article>
      ) : isLockedSection(dashboard, 'audienceGeography') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label="География"
            message={lockedSectionMessage(dashboard, 'audienceGeography') ?? 'Доступно с VIP'}
          />
        </div>
      ) : null}

      {dashboard.popularTimes?.byHour && caps.popularTimes ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>Популярные часы</h3>
          </div>
          <HourBars items={dashboard.popularTimes.byHour} />
        </article>
      ) : isLockedSection(dashboard, 'popularTimes') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label="Популярные часы"
            message={lockedSectionMessage(dashboard, 'popularTimes') ?? 'Доступно с VIP'}
          />
        </div>
      ) : null}

      <SectionTitle id="content">Контент</SectionTitle>
      {dashboard.promotions && caps.promotionAnalytics ? (
        <article className="card">
          <div className="card-header">
            <h3>Акции</h3>
          </div>
          <p>
            Просмотры акций: <strong>{formatNumber(dashboard.promotions.promotionViews)}</strong>
          </p>
          {dashboard.promotions.byPromotion && caps.promotionBreakdown ? (
            <table className="data-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Акция</th>
                  <th>Просмотры</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.promotions.byPromotion.map((row) => (
                  <tr key={row.promotionId}>
                    <td>{promotionTitles[row.promotionId] ?? `Акция ${row.promotionId.slice(0, 8)}…`}</td>
                    <td>{formatNumber(row.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {dashboard.promotions.actionsAvailable === false ? (
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              Действия по акциям пока не измеряются
            </p>
          ) : null}
        </article>
      ) : isLockedSection(dashboard, 'promotions') ? (
        <LockedCard
          label="Акции"
          message={lockedSectionMessage(dashboard, 'promotions') ?? 'Доступно с тарифа Бизнес'}
        />
      ) : null}

      {dashboard.catalog && caps.catalogAnalytics ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>Каталог</h3>
          </div>
          {dashboard.catalog.items.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Товар / услуга</th>
                  <th>Просмотры</th>
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
            <p style={{ color: 'var(--text-muted)' }}>Нет просмотров позиций каталога</p>
          )}
          {dashboard.catalog.actionsAvailable === false ? (
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              Действия по позициям каталога пока не измеряются
            </p>
          ) : null}
        </article>
      ) : isLockedSection(dashboard, 'catalog') ? (
        <div style={{ marginTop: 16 }}>
          <LockedCard
            label="Каталог"
            message={lockedSectionMessage(dashboard, 'catalog') ?? 'Доступно с VIP'}
          />
        </div>
      ) : null}

      {dashboard.benchmark ? (
        <>
          <SectionTitle id="benchmark">Сравнение с категорией</SectionTitle>
          <article className="card">
            <div className="card-header">
              <h3>{dashboard.benchmark.categoryTitle}</h3>
            </div>
            {dashboard.benchmark.status === 'INSUFFICIENT_DATA' ? (
              <p style={{ color: 'var(--text-muted)' }}>
                {dashboard.benchmark.message ?? 'Недостаточно данных для сравнения'}
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
            label="Сравнение с категорией"
            message={lockedSectionMessage(dashboard, 'benchmark') ?? 'Доступно с VIP'}
          />
        </div>
      ) : null}

      {dashboard.recommendations && dashboard.recommendations.length > 0 ? (
        <>
          <SectionTitle id="recommendations">Рекомендации</SectionTitle>
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
            label="Рекомендации"
            message={lockedSectionMessage(dashboard, 'recommendations') ?? 'Доступно с VIP'}
          />
        </div>
      ) : null}
    </>
  );
}
