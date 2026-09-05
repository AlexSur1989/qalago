'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MonetizationSubNavId } from '@/lib/monetization-utils';

const ITEMS: { id: MonetizationSubNavId; href: string; label: string }[] = [
  { id: 'overview', href: '/monetization', label: 'Обзор' },
  { id: 'orders', href: '/monetization/orders', label: 'Заказы' },
  { id: 'payments', href: '/monetization/payments', label: 'Оплаты' },
  { id: 'campaigns', href: '/monetization/campaigns', label: 'Кампании' },
  { id: 'creatives', href: '/monetization/creatives', label: 'Креативы' },
  { id: 'placements', href: '/monetization/placements', label: 'Рекламные места' },
];

type MonetizationSubNavProps = {
  badges?: Partial<Record<MonetizationSubNavId, number>>;
};

export function MonetizationSubNav({ badges }: MonetizationSubNavProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/monetization') {
      return pathname === '/monetization';
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="monetization-subnav" aria-label="Монетизация">
      {ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`monetization-subnav-item${isActive(item.href) ? ' active' : ''}`}
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
