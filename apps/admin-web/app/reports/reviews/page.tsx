'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { ReviewsReportView } from '@/components/reports/ReportViews';

export default function ReviewsReportPage() {
  return (
    <ClientReportPage
      reportId="reviews"
      title="Отзывы"
      description="Динамика отзывов и модерация."
      View={ReviewsReportView}
    />
  );
}
