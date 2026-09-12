'use client';

import { ComponentType, useEffect, useState } from 'react';
import { adminApi, CityRow } from '@/lib/api';
import { useReportPage } from '@/lib/reporting/use-report-page';
import type { ReportNavId } from '@/lib/report-rbac';
import { ReportPageShell } from './ReportPageShell';

type ClientReportPageProps<T> = {
  reportId: ReportNavId;
  title: string;
  description: string;
  View: ComponentType<{ data: T | null; loading: boolean }>;
  exportReportKey?: string;
  filterOptions?: {
    showCity?: boolean;
    showCategory?: boolean;
    showPlacement?: boolean;
    showPlan?: boolean;
  };
};

export function ClientReportPage<T>({
  reportId,
  title,
  description,
  View,
  exportReportKey,
  filterOptions,
}: ClientReportPageProps<T>) {
  const state = useReportPage<T>(reportId);
  const [cities, setCities] = useState<CityRow[]>([]);

  useEffect(() => {
    if (!state.token) return;
    adminApi
      .listCitiesAdmin(state.token)
      .then(setCities)
      .catch(() => setCities([]));
  }, [state.token]);

  return (
    <ReportPageShell
      title={title}
      description={description}
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
      filterOptions={filterOptions ?? { showCity: true }}
      exportReportKey={exportReportKey}
      token={state.token}
    >
      <View data={state.data} loading={state.loading} />
    </ReportPageShell>
  );
}
