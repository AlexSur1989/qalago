'use client';

import { ReactNode } from 'react';
import { AdminAuthenticatedShell } from '@/components/admin-authenticated-shell';

export default function AuditLogsLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthenticatedShell activeTab="moderation" loadPendingBadge={false}>
      {children}
    </AdminAuthenticatedShell>
  );
}
