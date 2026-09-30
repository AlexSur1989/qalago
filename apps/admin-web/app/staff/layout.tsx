'use client';

import { ReactNode } from 'react';
import { AdminAuthenticatedShell } from '@/components/admin-authenticated-shell';

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthenticatedShell activeTab="moderation" loadPendingBadge={false}>
      {children}
    </AdminAuthenticatedShell>
  );
}
