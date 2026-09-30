'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useAuth } from '@/lib/use-auth';
import { isSuperAdminRole } from '@/lib/rbac';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const superAdmin = user ? isSuperAdminRole(user.role) : false;

  return (
    <div className="report-page">
      <Link href="/dashboard">← Админка</Link>
      <h1>Настройки</h1>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link
          href="/settings/security"
          className={pathname === '/settings/security' ? 'tag tag-success' : 'tag tag-muted'}
        >
          Безопасность
        </Link>
        {superAdmin ? (
          <Link
            href="/settings/platform"
            className={pathname === '/settings/platform' ? 'tag tag-success' : 'tag tag-muted'}
          >
            Функции для бизнеса
          </Link>
        ) : null}
      </nav>
      {children}
    </div>
  );
}
