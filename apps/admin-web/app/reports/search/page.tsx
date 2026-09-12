'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { SearchReportView } from '@/components/reports/ReportViews';
import type { SearchReport } from '@/lib/reporting/types';

export default function SearchReportPage() {
  return (
    <ClientReportPage<SearchReport>
      reportId="search"
      title="Поиск"
      description="Объём и топ запросов с учётом порога приватности."
      View={SearchReportView}
    />
  );
}
