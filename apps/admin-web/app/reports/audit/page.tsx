'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { AuditReportView } from '@/components/reports/ReportViews';

export default function AuditReportPage() {
  return (
    <ClientReportPage
      reportId="audit"
      title="Audit"
      description="Журнал критичных действий (SUPER_ADMIN)."
      View={AuditReportView}
    />
  );
}
