'use client';

import { OverviewDashboard } from '@/components/reports/OverviewDashboard';
import type { OverviewReport } from '@/lib/reporting/types';
import { useReportPage } from '@/lib/reporting/use-report-page';
import { ReportPageShell } from '@/components/reports/ReportPageShell';
import { useEffect, useState } from 'react';
import { adminApi, CityRow } from '@/lib/api';

function OverviewView({ data, loading }: { data: OverviewReport | null; loading: boolean }) {
  return <OverviewDashboard data={data} loading={loading} />;
}

export default function ReportsOverviewPage() {
  const state = useReportPage<OverviewReport>('overview');
  const [cities, setCities] = useState<CityRow[]>([]);

  useEffect(() => {
    if (!state.token) return;
    adminApi.listCitiesAdmin(state.token).then(setCities).catch(() => setCities([]));
  }, [state.token]);

  return (
    <ReportPageShell
      title="Обзор платформы"
      description="Сводные KPI по доступным для вашей роли разделам."
      user={state.user}
      allowed={state.allowed}
      ready={state.ready}
      loading={state.loading}
      error={state.error}
      forbidden={state.forbidden}
      validationError={state.validationError}
      params={state.params}
      setParams={state.setParams}
      refresh={state.refresh}
      updatedAt={state.updatedAt}
      cities={cities}
      exportReportKey="overview"
      token={state.token}
    >
      <OverviewView data={state.data} loading={state.loading} />
    </ReportPageShell>
  );
}
