'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { CategoriesReportView } from '@/components/reports/ReportViews';

export default function CategoriesReportPage() {
  return (
    <ClientReportPage
      reportId="categories"
      title="Категории"
      description="Покрытие каталога по категориям."
      View={CategoriesReportView}
      exportReportKey="categories"
    />
  );
}
