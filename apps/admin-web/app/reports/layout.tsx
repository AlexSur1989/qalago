'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { canAccessAdminWeb } from '@/lib/rbac';
import { visibleReportNav } from '@/lib/report-rbac';
import { useAuth } from '@/lib/use-auth';

export default function ReportsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const nav = user ? visibleReportNav(user.role) : [];

  useEffect(() => {
    if (!ready) return;
    if (!user || !canAccessAdminWeb(user.role)) {
      router.replace('/login');
    }
  }, [ready, user, router]);

  if (!ready || !user) return null;

  return (
    <div className="shell" style={{ minHeight: '100vh' }}>
      <aside className="sidebar" style={{ width: 240 }}>
        <div className="sidebar-brand">
          <Link href="/dashboard" className="text-link">
            ← Панель
          </Link>
        </div>
        <h2 style={{ fontSize: '1rem', padding: '0 1rem' }}>Отчёты</h2>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <Link
              key={item.id}
              href={item.id === 'overview' ? '/reports' : `/reports/${item.id}`}
              className={`nav-item${pathname === (item.id === 'overview' ? '/reports' : `/reports/${item.id}`) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="page-content" style={{ flex: 1, padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  );
}
