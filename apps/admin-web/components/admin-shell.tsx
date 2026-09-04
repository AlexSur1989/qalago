'use client';

import { ReactNode } from 'react';
import { AuthUser } from '@/lib/api';
import { AdminTabId } from '@/lib/admin-utils';
import { getRoleDefinition } from '@/lib/rbac';

type NavItem = {
  id: AdminTabId;
  label: string;
  icon: string;
  adminOnly?: boolean;
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
  onLogout,
  children,
}: AdminShellProps) {
  const roleInfo = getRoleDefinition(user.role);
  const showUsers = user.role === 'ADMIN';

  const nav: NavItem[] = [
    { id: 'moderation', label: 'Модерация', icon: '📋', badge: badges.pending || null },
    { id: 'featured', label: 'VIP / Топ', icon: '⭐', badge: badges.featured || null },
    { id: 'reviews', label: 'Отзывы', icon: '💬', badge: badges.reviews || null },
    { id: 'categories', label: 'Категории', icon: '🗂️' },
    { id: 'content', label: 'AI-черновики', icon: '✨' },
    { id: 'users', label: 'Пользователи', icon: '👥', adminOnly: true },
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
          <div className="admin-role-meta">{user.phone}</div>
        </div>

        <nav className="sidebar-nav">
          {nav
            .filter((item) => !item.adminOnly || showUsers)
            .map((item) => (
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
            ))}
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
