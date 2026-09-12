'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { BusinessesReportView } from '@/components/reports/ReportViews';
import type { BusinessesReport } from '@/lib/reporting/types';

export default function BusinessesReportPage() {
  return (
    <ClientReportPage<BusinessesReport>
      reportId="businesses"
      title="Бизнесы"
      description="Статусы, география и тарифы заведений."
      View={BusinessesReportView}
    />
  );
}
