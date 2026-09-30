'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { reportHref, visibleReportNav } from '@/lib/report-rbac';
import type { AuthUser } from '@/lib/api';

type ReportsSubNavProps = {
  user: AuthUser;
};

export function ReportsSubNav({ user }: ReportsSubNavProps) {
  const pathname = usePathname();
  const nav = visibleReportNav(user.role);

  return (
    <nav className="shell-section-subnav shell-section-subnav--scroll" aria-label="Отчёты">
      {nav.map((item) => {
        const href = reportHref(item.id);
        const active =
          pathname === href || (item.id !== 'overview' && pathname.startsWith(href));
        return (
          <Link
            key={item.id}
            href={href}
            className={`shell-section-subnav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      {nav.some((n) => n.id === 'staff') ? (
        <Link
          href="/reports/staff/anomalies"
          className={`shell-section-subnav-item${
            pathname.includes('/staff/anomalies') ? ' active' : ''
          }`}
          aria-current={pathname.includes('/staff/anomalies') ? 'page' : undefined}
        >
          Аномалии staff
        </Link>
      ) : null}
    </nav>
  );
}
