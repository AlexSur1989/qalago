'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { ActivityReportView } from '@/components/reports/ReportViews';

export default function ActivityReportPage() {
  return (
    <ClientReportPage
      reportId="activity"
      title="Активность"
      description="Просмотры и intent-действия по заведениям."
      View={ActivityReportView}
      filterOptions={{ showCity: true, showCategory: true }}
    />
  );
}
