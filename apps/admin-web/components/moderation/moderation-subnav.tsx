'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [{ href: '/moderation/cases', label: 'Кейсы UGC' }] as const;

type ModerationSubNavProps = {
  openCaseCount?: number;
};

export function ModerationSubNav({ openCaseCount }: ModerationSubNavProps) {
  const pathname = usePathname();

  return (
    <nav className="monetization-subnav" aria-label="Модерация UGC">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`monetization-subnav-item${pathname.startsWith(item.href) ? ' active' : ''}`}
        >
          {item.label}
          {item.href === '/moderation/cases' &&
            openCaseCount != null &&
            openCaseCount > 0 && <span className="nav-badge">{openCaseCount}</span>}
        </Link>
      ))}
    </nav>
  );
}
