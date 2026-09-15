'use client';

import { useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { MonetizationSubNavId } from '@/lib/monetization-utils';

export function MonetizationSubNav() {
  const ui = useUi();
  const pathname = usePathname();

  const items = useMemo(
    (): { id: MonetizationSubNavId; href: string; label: string }[] => [
      { id: 'overview', href: '/monetization', label: ui.ownerNavOverview },
      { id: 'products', href: '/monetization/products', label: ui.text_d9c36c },
      { id: 'packages', href: '/monetization/packages', label: ui.text_4ec712 },
      { id: 'orders', href: '/monetization/orders', label: ui.__1c4a26 },
      { id: 'campaigns', href: '/monetization/campaigns', label: ui.__f71231 },
    ],
    [ui],
  );

  function isActive(href: string): boolean {
    if (href === '/monetization') {
      return pathname === '/monetization';
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="monetization-subnav" aria-label={ui.ownerNavPromote}>
      {items.map((item) => (
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
