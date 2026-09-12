'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { SecurityReportView } from '@/components/reports/ReportViews';

export default function SecurityReportPage() {
  return (
    <ClientReportPage
      reportId="security"
      title="Безопасность"
      description="Сводка инцидентов и governance (SUPER_ADMIN)."
      View={SecurityReportView}
    />
  );
}
