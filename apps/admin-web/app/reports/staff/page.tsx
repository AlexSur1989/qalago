'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { StaffReportView } from '@/components/reports/ReportViews';

export default function StaffReportPage() {
  return (
    <ClientReportPage
      reportId="staff"
      title="Сотрудники"
      description="Обзор staff и критичных действий (SUPER_ADMIN)."
      View={StaffReportView}
    />
  );
}
