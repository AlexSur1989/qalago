'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LegalSubNavId } from '@/lib/legal-utils';

type NavItem = {
  id: LegalSubNavId;
  href: string;
  label: string;
  superAdminOnly?: boolean;
};

const ITEMS: NavItem[] = [
  { id: 'documents', href: '/legal/documents', label: 'Юридические документы' },
  { id: 'data-requests', href: '/legal/data-requests', label: 'Запросы субъектов данных' },
  {
    id: 'government',
    href: '/legal/government',
    label: 'Гос. запросы',
    superAdminOnly: true,
  },
  {
    id: 'security',
    href: '/legal/security',
    label: 'Инциденты безопасности',
    superAdminOnly: true,
  },
];

type LegalSubNavProps = {
  showSuperAdminSections: boolean;
  pendingDataRequests?: number;
};

export function LegalSubNav({
  showSuperAdminSections,
  pendingDataRequests,
}: LegalSubNavProps) {
  const pathname = usePathname();

  return (
    <nav className="monetization-subnav" aria-label="Legal и compliance">
      {ITEMS.filter((item) => !item.superAdminOnly || showSuperAdminSections).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`monetization-subnav-item${pathname.startsWith(item.href) ? ' active' : ''}`}
        >
          {item.label}
          {item.id === 'data-requests' &&
            pendingDataRequests != null &&
            pendingDataRequests > 0 && (
              <span className="nav-badge">{pendingDataRequests}</span>
            )}
        </Link>
      ))}
    </nav>
  );
}
