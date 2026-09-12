'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { PlansReportView } from '@/components/reports/ReportViews';
import type { PlansReport } from '@/lib/reporting/types';

export default function PlansReportPage() {
  return (
    <ClientReportPage<PlansReport>
      reportId="plans"
      title="Тарифы"
      description="Распределение подписок и платящих бизнесов."
      View={PlansReportView}
      exportReportKey="plans"
    />
  );
}
