'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { BusinessRequestsSubNavId } from '@/lib/business-requests-utils';

const ITEMS: { id: BusinessRequestsSubNavId; href: string; label: string }[] = [
  { id: 'applications', href: '/business-requests/applications', label: 'Новые бизнесы' },
  { id: 'claims', href: '/business-requests/claims', label: 'Подтверждение владельца' },
];

type BusinessRequestsSubNavProps = {
  badges?: Partial<Record<BusinessRequestsSubNavId, number>>;
};

export function BusinessRequestsSubNav({ badges }: BusinessRequestsSubNavProps) {
  const pathname = usePathname();

  return (
    <nav className="monetization-subnav" aria-label="Заявки бизнеса">
      {ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`monetization-subnav-item${pathname.startsWith(item.href) ? ' active' : ''}`}
        >
          {item.label}
          {badges?.[item.id] != null && badges[item.id]! > 0 && (
            <span className="nav-badge">{badges[item.id]}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
