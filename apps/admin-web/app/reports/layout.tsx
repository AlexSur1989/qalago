'use client';

import { ReactNode } from 'react';
import { AdminAuthenticatedShell } from '@/components/admin-authenticated-shell';
import { BackofficePageHeader } from '@/components/backoffice-page-header';
import { ReportsSubNav } from '@/components/reports/reports-subnav';
import { useAuth } from '@/lib/use-auth';

export default function ReportsLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <p className="muted">Загрузка…</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <AdminAuthenticatedShell activeTab="moderation">
      <BackofficePageHeader title="Отчёты" description="Аналитика и операционные сводки по роли." />
      <ReportsSubNav user={user} />
      <div className="shell-page-body">{children}</div>
    </AdminAuthenticatedShell>
  );
}
