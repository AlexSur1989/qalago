'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MonetizationSubNavId } from '@/lib/monetization-utils';

const ITEMS: { id: MonetizationSubNavId; href: string; label: string }[] = [
  { id: 'overview', href: '/monetization', label: 'Обзор' },
  { id: 'products', href: '/monetization/products', label: 'Рекламные продукты' },
  { id: 'packages', href: '/monetization/packages', label: 'Пакеты' },
  { id: 'orders', href: '/monetization/orders', label: 'Мои заказы' },
  { id: 'campaigns', href: '/monetization/campaigns', label: 'Мои кампании' },
];

export function MonetizationSubNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/monetization') {
      return pathname === '/monetization';
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="monetization-subnav" aria-label="Реклама и продвижение">
      {ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`monetization-subnav-item${isActive(item.href) ? ' active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
