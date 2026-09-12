'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthUser } from '@/lib/api';
import { AdminTabId } from '@/lib/admin-utils';
import { canManageCities, canViewUsers, getRoleDefinition } from '@/lib/rbac';
import type { MonetizationSubNavId } from '@/lib/monetization-utils';

type NavItem = {
  id: AdminTabId;
  label: string;
  icon: string;
  visible?: boolean;
  badge?: number | string | null;
};

type AdminShellProps = {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  user: AuthUser;
  citySlug: string;
  cities: { slug: string; nameRu: string }[];
  cityLocked: boolean;
  onCityChange: (slug: string) => void;
  badges: {
    pending: number;
    featured: number;
    reviews: number;
  };
  monetizationBadges?: Partial<Record<MonetizationSubNavId, number>>;
  businessRequestBadges?: { applications?: number; claims?: number };
  moderationCaseBadge?: number;
  legalDataRequestBadge?: number;
  onLogout: () => void;
  children: ReactNode;
};

export function AdminShell({
  activeTab,
  onTabChange,
  user,
  citySlug,
  cities,
  cityLocked,
  onCityChange,
  badges,
  monetizationBadges,
  businessRequestBadges,
  moderationCaseBadge,
  legalDataRequestBadge,
  onLogout,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const roleInfo = getRoleDefinition(user.role);

  const monetizationBadgeTotal =
    (monetizationBadges?.orders ?? 0) + (monetizationBadges?.creatives ?? 0);

  const businessRequestsBadgeTotal =
    (businessRequestBadges?.applications ?? 0) + (businessRequestBadges?.claims ?? 0);

  const nav: NavItem[] = [
    { id: 'moderation', label: 'Модерация', icon: '📋', badge: badges.pending || null },
    { id: 'featured', label: 'VIP / Топ', icon: '⭐', badge: badges.featured || null },
    { id: 'reviews', label: 'Отзывы', icon: '💬', badge: badges.reviews || null },
    { id: 'monetization', label: 'Монетизация', icon: '💰', badge: monetizationBadgeTotal || null },
    { id: 'categories', label: 'Категории', icon: '🗂️' },
    { id: 'content', label: 'AI-черновики', icon: '✨' },
    { id: 'users', label: 'Пользователи', icon: '👥', visible: canViewUsers(user.role) },
    { id: 'cities', label: 'Города', icon: '🏙️', visible: canManageCities(user.role) },
  ];

  const cityLabel =
    user.managedCity?.nameRu ??
    cities.find((c) => c.slug === citySlug)?.nameRu ??
    citySlug;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">Q</span>
          <span>QalaGo Admin</span>
        </div>

        <div className="admin-role-card">
          <div className="admin-role-title">{roleInfo.labelRu}</div>
          <div className="admin-role-meta">{user.phone ?? 'Телефон не указан'}</div>
        </div>

        <nav className="sidebar-nav">
          {nav
            .filter((item) => item.visible !== false)
            .map((item) =>
              item.id === 'monetization' ? (
                <Link
                  key={item.id}
                  href="/monetization"
                  className={`nav-item${
                    activeTab === 'monetization' || pathname.startsWith('/monetization')
                      ? ' active'
                      : ''
                  }`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge != null && item.badge !== 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </Link>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item${activeTab === item.id ? ' active' : ''}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge != null && item.badge !== 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              ),
            )}
          <Link
            href="/business-requests/applications"
            className={`nav-item${pathname.startsWith('/business-requests') ? ' active' : ''}`}
          >
            <span className="nav-icon">📝</span>
            <span>Заявки бизнеса</span>
            {businessRequestsBadgeTotal > 0 && (
              <span className="nav-badge">{businessRequestsBadgeTotal}</span>
            )}
          </Link>
          <Link
            href="/moderation/cases"
            className={`nav-item${pathname.startsWith('/moderation') ? ' active' : ''}`}
          >
            <span className="nav-icon">🚩</span>
            <span>Модерация UGC</span>
            {moderationCaseBadge != null && moderationCaseBadge > 0 && (
              <span className="nav-badge">{moderationCaseBadge}</span>
            )}
          </Link>
          <Link
            href="/legal/documents"
            className={`nav-item${pathname.startsWith('/legal') ? ' active' : ''}`}
          >
            <span className="nav-icon">⚖️</span>
            <span>Legal</span>
            {legalDataRequestBadge != null && legalDataRequestBadge > 0 && (
              <span className="nav-badge">{legalDataRequestBadge}</span>
            )}
          </Link>
          <Link
            href="/audit-logs"
            className={`nav-item${pathname.startsWith('/audit-logs') ? ' active' : ''}`}
          >
            <span className="nav-icon">🛡️</span>
            <span>Аудит</span>
          </Link>
        </nav>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-left">
            {cityLocked ? (
              <div className="city-picker">
                <span>📍</span>
                <span>{cityLabel}</span>
              </div>
            ) : (
              <label className="city-picker">
                <span>📍</span>
                <select
                  value={citySlug}
                  onChange={(e) => onCityChange(e.target.value)}
                  className="city-select"
                >
                  {cities.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {city.nameRu}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="topbar-right">
            <div className="user-chip">
              <div className="user-avatar">A</div>
              <div className="user-meta">
                <strong>{user.name ?? 'Администратор'}</strong>
                <span>{roleInfo.labelRu}</span>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
              Выйти
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
