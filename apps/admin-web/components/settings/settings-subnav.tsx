'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { showAdminHomeSectionsNav, showAdminPlatformSettingsNav } from '@/lib/admin-shell-nav';
import type { AuthUser } from '@/lib/api';

type SettingsSubNavProps = {
  user: AuthUser;
};

export function SettingsSubNav({ user }: SettingsSubNavProps) {
  const pathname = usePathname();
  const superPlatform = showAdminPlatformSettingsNav(user.role);
  const homeSections = showAdminHomeSectionsNav(user.role);

  return (
    <nav className="shell-section-subnav" aria-label="Настройки">
      <Link
        href="/settings/security"
        className={`shell-section-subnav-item${pathname === '/settings/security' ? ' active' : ''}`}
        aria-current={pathname === '/settings/security' ? 'page' : undefined}
      >
        Безопасность
      </Link>
      {homeSections ? (
        <Link
          href="/settings/home-sections"
          className={`shell-section-subnav-item${pathname === '/settings/home-sections' ? ' active' : ''}`}
          aria-current={pathname === '/settings/home-sections' ? 'page' : undefined}
        >
          Главная (секции)
        </Link>
      ) : null}
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
