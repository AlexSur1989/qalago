'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { showAdminPlatformSettingsNav } from '@/lib/admin-shell-nav';
import type { AuthUser } from '@/lib/api';

type SettingsSubNavProps = {
  user: AuthUser;
};

export function SettingsSubNav({ user }: SettingsSubNavProps) {
  const pathname = usePathname();
  const superPlatform = showAdminPlatformSettingsNav(user.role);

  return (
    <nav className="shell-section-subnav" aria-label="Настройки">
      <Link
        href="/settings/security"
        className={`shell-section-subnav-item${pathname === '/settings/security' ? ' active' : ''}`}
        aria-current={pathname === '/settings/security' ? 'page' : undefined}
      >
        Безопасность
      </Link>
      {superPlatform ? (
        <Link
          href="/settings/platform"
          className={`shell-section-subnav-item${pathname === '/settings/platform' ? ' active' : ''}`}
          aria-current={pathname === '/settings/platform' ? 'page' : undefined}
        >
          Функции для бизнеса
        </Link>
      ) : null}
    </nav>
  );
}
