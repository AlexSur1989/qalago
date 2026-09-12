'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { UsersReportView } from '@/components/reports/ReportViews';

export default function UsersReportPage() {
  return (
    <ClientReportPage
      reportId="users"
      title="Пользователи"
      description="Агрегаты по пользователям платформы (без PII)."
      View={UsersReportView}
    />
  );
}
