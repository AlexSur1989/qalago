'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { canAccessAdminWeb } from '@/lib/rbac';
import { reportHref, visibleReportNav } from '@/lib/report-rbac';
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
    <div className="report-layout">
      <aside className="report-sidebar">
        <div className="report-sidebar-head">
          <Link href="/dashboard" className="text-link">
            ← Панель
          </Link>
          <h2>Отчёты</h2>
        </div>
        <nav className="report-sidebar-nav">
          {nav.map((item) => {
            const href = reportHref(item.id);
            const active =
              pathname === href || (item.id !== 'overview' && pathname.startsWith(href));
            return (
              <Link key={item.id} href={href} className={`report-nav-item${active ? ' active' : ''}`}>
                {item.label}
              </Link>
            );
          })}
          {nav.some((n) => n.id === 'staff') ? (
            <Link
              href="/reports/staff/anomalies"
              className={`report-nav-item${pathname.includes('/staff/anomalies') ? ' active' : ''}`}
            >
              Аномалии staff
            </Link>
          ) : null}
        </nav>
      </aside>
      <main className="report-main">{children}</main>
    </div>
  );
}
