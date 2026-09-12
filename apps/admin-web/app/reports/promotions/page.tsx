'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { PromotionsReportView } from '@/components/reports/ReportViews';

export default function PromotionsReportPage() {
  return (
    <ClientReportPage
      reportId="promotions"
      title="Акции"
      description="Жизненный цикл промо-акций."
      View={PromotionsReportView}
    />
  );
}
