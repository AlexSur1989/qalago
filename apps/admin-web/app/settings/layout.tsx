'use client';

import { ReactNode } from 'react';
import { AdminAuthenticatedShell } from '@/components/admin-authenticated-shell';
import { BackofficePageHeader } from '@/components/backoffice-page-header';
import { SettingsSubNav } from '@/components/settings/settings-subnav';
import { useAuth } from '@/lib/use-auth';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready || !user) {
    return <p className="muted">Загрузка…</p>;
  }

  return (
    <AdminAuthenticatedShell activeTab="moderation" loadPendingBadge={false}>
      <BackofficePageHeader title="Настройки" description="Безопасность учётной записи и параметры платформы." />
      <SettingsSubNav user={user} />
      <div className="shell-page-body">{children}</div>
    </AdminAuthenticatedShell>
  );
}
