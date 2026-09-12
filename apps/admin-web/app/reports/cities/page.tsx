'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { CitiesReportView } from '@/components/reports/ReportViews';

export default function CitiesReportPage() {
  return (
    <ClientReportPage
      reportId="cities"
      title="Города"
      description="Сравнение городов по активности и бизнесам."
      View={CitiesReportView}
      exportReportKey="cities"
    />
  );
}
