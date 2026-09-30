'use client';

import Link from 'next/link';
import { formatCount, formatDate, formatDateTime, formatKzt, isMetricSupported } from '@/lib/reporting/format';
import {
  INTENT_ACTION_LABELS,
  planTierLabel,
  reportPlacementLabel,
} from '@/lib/reporting/labels';
import type { BusinessesReport, FinanceReport, OverviewReport, PlansReport, SearchReport } from '@/lib/reporting/types';
import { BackofficeBadge } from '@qalago/brand/badges';
import { businessStatusPresentation } from '@qalago/brand/status';
import {
  BackofficeTable,
  BackofficeTableBody,
  BackofficeTableCell,
  BackofficeTableContainer,
  BackofficeTableHead,
  BackofficeTableHeaderCell,
  BackofficeTableRow,
} from '@qalago/brand/tables';
import { ReportBarChart } from './ReportCharts';
import { ReportKpiCard, ReportKpiGrid } from './ReportKpiCard';
import { ReportSection } from './ReportSection';
import { ReportEmptyState, ReportUnsupportedState } from './ReportStates';

export function UsersReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  const m = (data?.metrics ?? data) as Record<string, unknown> | undefined;
  return (
    <>
      <ReportKpiGrid>
        <ReportKpiCard label="Всего пользователей" value={m?.total as number} loading={loading} />
        <ReportKpiCard label="Новые за период" value={m?.newInRange as number} loading={loading} />
        <ReportKpiCard label="Неактивные" value={m?.inactive as number} loading={loading} neutralTrend />
        <ReportKpiCard label="Активные (DAU/MAU)" value={(m?.activeUsers as number | null) ?? null} loading={loading} />
      </ReportKpiGrid>
      <p className="muted">Тренд по дням: метрика пока недоступна на backend.</p>
    </>
  );
}

export function BusinessesReportView({ data, loading }: { data: BusinessesReport | null; loading: boolean }) {
  const s = data?.summary;
  const chartCity =
    data?.byCity?.map((r) => ({ name: r.cityId.slice(0, 8), count: r._count._all })) ?? [];
  const chartPlan =
    data?.planDistribution?.map((r) => ({
      name: planTierLabel(r.planTier),
      count: r._count._all,
    })) ?? [];

  return (
    <>
      <ReportKpiGrid>
        <ReportKpiCard label="Всего" value={s?.total} loading={loading} />
        <ReportKpiCard label="Активные" value={s?.active} loading={loading} />
        <ReportKpiCard label="На модерации" value={s?.pending} loading={loading} neutralTrend />
        <ReportKpiCard label="Заблокированы" value={s?.blocked} loading={loading} neutralTrend />
        <ReportKpiCard label="С владельцем" value={s?.withOwnerAssigned} loading={loading} />
      </ReportKpiGrid>
      <ReportBarChart data={chartCity} xKey="name" yKey="count" title="По городам" loading={loading} />
      <ReportBarChart data={chartPlan} xKey="name" yKey="count" title="Тарифы" loading={loading} />
      {data?.newBusinesses?.items?.length ? (
        <ReportSection title="Новые бизнесы">
          <BackofficeTableContainer className="report-table-scroll">
            <BackofficeTable density="compact">
              <BackofficeTableHead>
                <tr>
                  <BackofficeTableHeaderCell>Название</BackofficeTableHeaderCell>
                  <BackofficeTableHeaderCell>Статус</BackofficeTableHeaderCell>
                  <BackofficeTableHeaderCell>Тариф</BackofficeTableHeaderCell>
                  <BackofficeTableHeaderCell>Создан</BackofficeTableHeaderCell>
                </tr>
              </BackofficeTableHead>
              <BackofficeTableBody>
                {data.newBusinesses.items.map((row) => {
                  const statusPresentation = businessStatusPresentation(row.status);
                  return (
                    <BackofficeTableRow key={row.id}>
                      <BackofficeTableCell variant="truncate">{row.title}</BackofficeTableCell>
                      <BackofficeTableCell>
                        <BackofficeBadge
                          label={statusPresentation.label}
                          tone={statusPresentation.tone}
                          size="compact"
                        />
                      </BackofficeTableCell>
                      <BackofficeTableCell>{planTierLabel(row.planTier)}</BackofficeTableCell>
                      <BackofficeTableCell>{formatDate(row.createdAt)}</BackofficeTableCell>
                    </BackofficeTableRow>
                  );
                })}
              </BackofficeTableBody>
            </BackofficeTable>
          </BackofficeTableContainer>
        </ReportSection>
      ) : (
        <ReportEmptyState title="Нет новых бизнесов за период" />
      )}
    </>
  );
}

export function CitiesReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  const rows = (data?.cities as Array<Record<string, unknown>>) ?? [];
  if (!loading && !rows.length) return <ReportEmptyState title="Нет данных по городам" />;
  return (
    <div className="report-table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Город</th>
            <th>Бизнесы</th>
            <th>Активные</th>
            <th>Просмотры</th>
            <th>Intent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const city = row.city as { nameRu?: string; slug?: string };
            const biz = row.businesses as { total?: number; active?: number };
            const act = row.activity as { businessViews?: number; intentActions?: number };
            return (
              <tr key={city.slug}>
                <td>{city.nameRu ?? city.slug}</td>
                <td>{formatCount(biz?.total)}</td>
                <td>{formatCount(biz?.active)}</td>
                <td>{formatCount(act?.businessViews)}</td>
                <td>{formatCount(act?.intentActions)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CategoriesReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  const rows =
    (data?.businessesByCategory as { categoryId: string; _count: { _all: number } }[]) ?? [];
  return (
    <>
      <p className="muted">Детализация по подкатегориям будет добавлена позже.</p>
      <ReportBarChart
        data={rows.map((r) => ({ name: r.categoryId.slice(0, 8), count: r._count._all }))}
        xKey="name"
        yKey="count"
        title="Бизнесы по категориям"
        loading={loading}
      />
    </>
  );
}

export function SearchReportView({ data, loading }: { data: SearchReport | null; loading: boolean }) {
  const queries = data?.topQueries ?? data?.queries ?? [];
  return (
    <>
      <ReportKpiGrid>
        <ReportKpiCard label="Объём поиска" value={data?.volume} loading={loading} />
      </ReportKpiGrid>
      <p className="muted">
        Запросы с недостаточным количеством событий скрываются для защиты приватности (порог ≥ 3).
      </p>
      {queries.length ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Запрос</th>
              <th>Поиски</th>
              <th>Доля</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((q) => (
              <tr key={q.query}>
                <td>{q.query}</td>
                <td>{formatCount(q.count)}</td>
                <td>{q.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ReportEmptyState title="Недостаточно данных по запросам" />
      )}
    </>
  );
}

export function ActivityReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  const m = (data?.metrics ?? data) as Record<string, unknown> | undefined;
  const by = (m?.byActionType ?? {}) as Record<string, number>;
  const chart = Object.entries(by).map(([k, v]) => ({
    name: INTENT_ACTION_LABELS[k] ?? k,
    count: v,
  }));
  return (
    <>
      <ReportKpiGrid>
        <ReportKpiCard label="Показы" value={m?.businessImpressions as number} loading={loading} />
        <ReportKpiCard label="Просмотры" value={m?.businessViews as number} loading={loading} />
        <ReportKpiCard label="Intent всего" value={m?.intentActions as number} loading={loading} />
      </ReportKpiGrid>
      <ReportBarChart data={chart} xKey="name" yKey="count" title="Intent по типам" loading={loading} />
    </>
  );
}

export function ReviewsReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  return (
    <ReportKpiGrid>
      <ReportKpiCard label="Создано за период" value={data?.reviewsCreated as number} loading={loading} />
      <ReportKpiCard label="Скрыто модерацией" value={data?.hiddenReviews as number} loading={loading} neutralTrend />
      <ReportKpiCard
        label="Средний рейтинг"
        value={data?.averageRating as number}
        loading={loading}
        formatValue={(v) => v.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
      />
    </ReportKpiGrid>
  );
}

export function PromotionsReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  return (
    <ReportKpiGrid>
      <ReportKpiCard label="Активные" value={data?.active as number} loading={loading} />
      <ReportKpiCard label="Создано за период" value={data?.createdInRange as number} loading={loading} />
      <ReportKpiCard label="Истекли" value={data?.expired as number} loading={loading} neutralTrend />
      <ReportKpiCard label="Скрыты модерацией" value={data?.moderationHidden as number} loading={loading} neutralTrend />
    </ReportKpiGrid>
  );
}

export function AdsReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  const byPlacement = (data?.byPlacement as { code: string; campaigns: number; impressions: number; clicks: number; ctr: number | null }[]) ?? [];
  return (
    <>
      <ReportBarChart
        data={byPlacement.map((p) => ({
          name: reportPlacementLabel(p.code),
          count: p.campaigns,
        }))}
        xKey="name"
        yKey="count"
        title="Кампании по размещениям"
        loading={loading}
      />
      <table className="data-table">
        <thead>
          <tr>
            <th>Размещение</th>
            <th>Кампании</th>
            <th>Показы</th>
            <th>Клики</th>
            <th>CTR</th>
          </tr>
        </thead>
        <tbody>
          {byPlacement.map((p) => (
            <tr key={p.code}>
              <td>{reportPlacementLabel(p.code)}</td>
              <td>{formatCount(p.campaigns)}</td>
              <td>{formatCount(p.impressions)}</td>
              <td>{formatCount(p.clicks)}</td>
              <td>{p.ctr != null ? `${(p.ctr * 100).toFixed(1)}%` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function PlansReportView({ data, loading }: { data: PlansReport | null; loading: boolean }) {
  const chart =
    data?.distribution?.map((d) => ({
      name: planTierLabel(d.planTier),
      count: d._count._all,
    })) ?? [];
  return (
    <>
      <ReportKpiGrid>
        <ReportKpiCard
          label="Доля платящих"
          value={
            data?.payingBusinessShare != null ? Math.round(data.payingBusinessShare * 1000) / 10 : null
          }
          loading={loading}
          format="percent"
        />
      </ReportKpiGrid>
      <p className="muted">Churn: пока недоступно</p>
      <ReportBarChart data={chart} xKey="name" yKey="count" title="Распределение тарифов" loading={loading} />
    </>
  );
}

export function FinanceReportView({ data, loading }: { data: FinanceReport | null; loading: boolean }) {
  return (
    <ReportKpiGrid>
      <ReportKpiCard label="Выручка за период" value={data?.revenueKzt} loading={loading} formatValue={formatKzt} />
      <ReportKpiCard label="Заказов" value={data?.ordersCount} loading={loading} />
      <ReportKpiCard label="Оплачено" value={data?.paidCount} loading={loading} />
      <ReportKpiCard label="Ожидают оплаты" value={data?.pendingCount} loading={loading} neutralTrend />
      <ReportKpiCard
        label="Средний чек"
        value={data?.averageOrderValueKzt ?? null}
        loading={loading}
        formatValue={formatKzt}
      />
      <ReportKpiCard label="Возвраты" value={data?.refundedCount} loading={loading} neutralTrend />
    </ReportKpiGrid>
  );
}

export function ModerationReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  const byStatus = (data?.byStatus as { status: string; _count: { _all: number } }[]) ?? [];
  return (
    <>
      <ReportKpiGrid>
        <ReportKpiCard label="Открытые кейсы" value={data?.openCases as number} loading={loading} neutralTrend />
        <ReportKpiCard label="Новые жалобы" value={data?.newReports as number} loading={loading} />
        <ReportKpiCard label="Решено" value={data?.resolvedInRange as number} loading={loading} />
        <ReportKpiCard label="Апелляции" value={data?.appealsInRange as number} loading={loading} />
      </ReportKpiGrid>
      <ReportBarChart
        data={byStatus.map((s) => ({ name: s.status, count: s._count._all }))}
        xKey="name"
        yKey="count"
        title="По статусам"
        loading={loading}
      />
      <p className="muted">{String(data?.moderatorLeaderboardNote ?? '')}</p>
    </>
  );
}

export function StaffReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  return (
    <>
      <ReportKpiGrid>
        <ReportKpiCard label="Всего staff" value={data?.total as number} loading={loading} />
        <ReportKpiCard label="Активных" value={data?.active as number} loading={loading} />
        <ReportKpiCard label="Отключённых" value={data?.disabled as number} loading={loading} neutralTrend />
      </ReportKpiGrid>
      <p className="muted">MFA: не настроено — функция ещё не внедрена</p>
      <Link href="/staff" className="text-link">
        Управление staff →
      </Link>
    </>
  );
}

export function AuditReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  const items = (data?.items as Record<string, unknown>[]) ?? [];
  if (!loading && !items.length) return <ReportEmptyState title="Нет записей аудита" />;
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Время</th>
          <th>Действие</th>
          <th>Роль</th>
          <th>Ресурс</th>
        </tr>
      </thead>
      <tbody>
        {items.map((row) => (
          <tr key={String(row.id)}>
            <td>{formatDateTime(row.createdAt as string)}</td>
            <td>{String(row.action)}</td>
            <td>{String(row.actorRole ?? '—')}</td>
            <td>{String(row.resourceType)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SecurityReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  return (
    <ReportKpiGrid>
      <ReportKpiCard
        label="Открытые инциденты"
        value={data?.openSecurityIncidents as number}
        loading={loading}
        neutralTrend
      />
    </ReportKpiGrid>
  );
}

export function SystemReportView({ data, loading }: { data: Record<string, unknown> | null; loading: boolean }) {
  const release = data?.release as Record<string, unknown> | null;
  const flags = data?.featureFlags as { total?: number; globallyEnabled?: number } | undefined;
  return (
    <>
      <ReportKpiGrid>
        <ReportKpiCard label="API" value={1} loading={loading} formatValue={() => String(data?.apiVersion ?? 'v1')} neutralTrend />
        <ReportKpiCard
          label="Обслуживание"
          value={data?.maintenanceMode ? 1 : 0}
          loading={loading}
          formatValue={(v) => (v ? 'Включено' : 'Выключено')}
          neutralTrend
        />
        <ReportKpiCard label="Feature flags" value={flags?.total} loading={loading} neutralTrend />
      </ReportKpiGrid>
      <p className="muted">
        Android min: {String(release?.androidMinimumVersion ?? '—')} · Redis:{' '}
        {data?.redisHealth == null ? 'не подключено' : String(data.redisHealth)}
      </p>
    </>
  );
}
