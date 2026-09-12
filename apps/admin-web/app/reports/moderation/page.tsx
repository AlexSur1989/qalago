'use client';

import { ClientReportPage } from '@/components/reports/ClientReportPage';
import { ModerationReportView } from '@/components/reports/ReportViews';

export default function ModerationReportPage() {
  return (
    <ClientReportPage
      reportId="moderation"
      title="Модерация"
      description="Очередь кейсов и жалоб."
      View={ModerationReportView}
    />
  );
}
