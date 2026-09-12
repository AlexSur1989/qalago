'use client';

import type { OverviewReport } from '@/lib/reporting/types';
import { formatCount, formatKzt, isMetricSupported } from '@/lib/reporting/format';
import { ReportKpiCard, ReportKpiGrid } from './ReportKpiCard';
import { ReportSection } from './ReportSection';

export function OverviewDashboard({ data, loading }: { data: OverviewReport | null; loading: boolean }) {
  const u = data?.platform?.users;
  const b = data?.platform?.businesses;
  const c = data?.platform?.cities;
  const act = data?.activity;
  const com = data?.commercial;
  const mod = data?.moderation;
  const staff = data?.staff;
  const sec = data?.security as Record<string, unknown> | undefined;
  const sys = data?.system as Record<string, unknown> | undefined;

  return (
    <div className="report-sections">
      {u || b || c ? (
        <ReportSection title="Платформа">
          <ReportKpiGrid>
            <ReportKpiCard label="Пользователи" value={u?.total} loading={loading} />
            <ReportKpiCard label="Новые пользователи" value={u?.newInRange} loading={loading} />
            <ReportKpiCard
              label="Активные пользователи"
              value={u?.activeUsers ?? null}
              loading={loading}
            />
            <ReportKpiCard label="Бизнесы" value={b?.total} loading={loading} />
            <ReportKpiCard label="Активные бизнесы" value={b?.active} loading={loading} />
            <ReportKpiCard label="Города" value={c?.total} loading={loading} />
          </ReportKpiGrid>
        </ReportSection>
      ) : null}

      {act ? (
        <ReportSection title="Активность">
          <ReportKpiGrid>
            <ReportKpiCard label="Просмотры" value={act.businessViews} loading={loading} />
            <ReportKpiCard label="Intent-действия" value={act.intentActions} loading={loading} />
            <ReportKpiCard label="Поиски" value={act.searches} loading={loading} />
            <ReportKpiCard label="Отзывы" value={act.reviewsCreated} loading={loading} />
          </ReportKpiGrid>
        </ReportSection>
      ) : null}

      {com ? (
        <ReportSection title="Коммерция">
          <ReportKpiGrid>
            <ReportKpiCard label="Заказы" value={com.orders} loading={loading} />
            <ReportKpiCard label="Оплаченные заказы" value={com.paidOrders} loading={loading} />
            <ReportKpiCard label="Активные кампании" value={com.activeAdCampaigns} loading={loading} />
            <ReportKpiCard
              label="Ожидают оплаты"
              value={com.pendingPayments}
              loading={loading}
              neutralTrend
            />
            {isMetricSupported(com.revenueKzt) ? (
              <ReportKpiCard
                label="Выручка за период"
                value={com.revenueKzt}
                loading={loading}
                formatValue={formatKzt}
              />
            ) : null}
          </ReportKpiGrid>
        </ReportSection>
      ) : null}

      {mod ? (
        <ReportSection title="Модерация">
          <ReportKpiGrid>
            <ReportKpiCard label="Открытые кейсы" value={mod.openCases} loading={loading} neutralTrend />
            <ReportKpiCard label="Новые жалобы" value={mod.newReports} loading={loading} />
            <ReportKpiCard label="Решено за период" value={mod.resolvedInRange} loading={loading} />
            <ReportKpiCard label="Апелляции" value={mod.appealsInRange} loading={loading} />
          </ReportKpiGrid>
        </ReportSection>
      ) : null}

      {staff ? (
        <ReportSection title="Staff">
          <ReportKpiGrid>
            <ReportKpiCard label="Всего staff" value={staff.total} loading={loading} />
            <ReportKpiCard label="Активных" value={staff.active} loading={loading} />
            <ReportKpiCard label="Отключённых" value={staff.disabled} loading={loading} neutralTrend />
          </ReportKpiGrid>
          <p className="muted">MFA: не настроено — функция ещё не внедрена</p>
        </ReportSection>
      ) : null}

      {sec ? (
        <ReportSection title="Безопасность">
          <ReportKpiGrid>
            <ReportKpiCard
              label="Открытые инциденты"
              value={sec.openSecurityIncidents as number | undefined}
              loading={loading}
              neutralTrend
            />
          </ReportKpiGrid>
        </ReportSection>
      ) : null}

      {sys ? (
        <ReportSection title="Система">
          <ReportKpiGrid>
            <ReportKpiCard
              label="Режим обслуживания"
              value={sys.maintenanceMode ? 1 : 0}
              loading={loading}
              formatValue={(v) => (v ? 'Включён' : 'Выключен')}
              neutralTrend
            />
          </ReportKpiGrid>
          <p className="muted">
            DB: {String(sys.dbConnectivity ?? '—')}
            {sys.redisHealth == null ? ' · Redis: не подключено' : ''}
          </p>
        </ReportSection>
      ) : null}
    </div>
  );
}
