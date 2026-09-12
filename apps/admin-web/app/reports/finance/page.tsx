'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { FinanceReportView } from '@/components/reports/ReportViews';
import type { FinanceReport } from '@/lib/reporting/types';

export default function FinanceReportPage() {
  return (
    <ClientReportPage<FinanceReport>
      reportId="finance"
      title="Финансы"
      description="Выручка и заказы по данным платежей (snapshot)."
      View={FinanceReportView}
      exportReportKey="finance"
    />
  );
}
