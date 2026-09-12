'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { AdsReportView } from '@/components/reports/ReportViews';

export default function AdsReportPage() {
  return (
    <ClientReportPage
      reportId="ads"
      title="Реклама"
      description="Кампании, размещения и эффективность."
      View={AdsReportView}
      filterOptions={{ showCity: true, showPlacement: true }}
    />
  );
}
