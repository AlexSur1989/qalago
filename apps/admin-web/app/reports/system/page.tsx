'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { SystemReportView } from '@/components/reports/ReportViews';

export default function SystemReportPage() {
  return (
    <ClientReportPage
      reportId="system"
      title="Система"
      description="Release, feature flags и health."
      View={SystemReportView}
    />
  );
}
