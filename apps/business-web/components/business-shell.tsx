'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { BusinessRow, SELECTED_BUSINESS_KEY, TOKEN_KEY, ownerApi } from '@/lib/api';
import { businessInitials, statusLabel } from '@/lib/business-utils';

export type NavId =
  | 'home'
  | 'profile'
  | 'menu'
  | 'promotions'
  | 'media'
  | 'reviews'
  | 'stats'
  | 'messages'
  | 'settings'
  | 'plan'
  | 'help';

type NavItem = {
  id: NavId;
  label: string;
  icon: string;
  href?: (businessId: string) => string;
  soon?: boolean;
};

const NAV: NavItem[] = [
  { id: 'home', label: 'Главная', icon: '🏠', href: () => '/dashboard' },
  { id: 'profile', label: 'Профиль заведения', icon: '🏪', href: (id) => `/business/${id}` },
  { id: 'menu', label: 'Услуги и меню', icon: '📋', href: (id) => `/business/${id}/menu` },
  { id: 'promotions', label: 'Акции', icon: '🏷️', href: (id) => `/business/${id}/promotions` },
  { id: 'media', label: 'Фото и видео', icon: '📷', href: (id) => `/business/${id}/media` },
  { id: 'reviews', label: 'Отзывы', icon: '⭐', href: (id) => `/business/${id}/reviews` },
  { id: 'stats', label: 'Статистика', icon: '📊', href: () => '/dashboard' },
  { id: 'messages', label: 'Сообщения', icon: '💬', href: () => '/messages' },
  { id: 'settings', label: 'Настройки', icon: '⚙️', soon: true },
];

const FOOTER_NAV: NavItem[] = [
  { id: 'plan', label: 'Тариф и продвижение', icon: '💎', href: () => '/plan' },
  { id: 'help', label: 'Помощь', icon: '❓', href: () => '/help' },
];

type BusinessShellProps = {
  activeNav: NavId;
  business: BusinessRow | null;
  businesses: BusinessRow[];
  cityName?: string;
  userName?: string;
  onLogout: () => void;
  children: ReactNode;
};

export function BusinessShell({
  activeNav,
  business,
  businesses,
  cityName = 'Уральск',
  userName,
  onLogout,
  children,
}: BusinessShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    ownerApi
      .unreadNotificationCount(token)
      .then((res) => setUnreadCount(res.count))
      .catch(() => setUnreadCount(0));
  }, [activeNav]);

  function selectBusiness(id: string) {
    localStorage.setItem(SELECTED_BUSINESS_KEY, id);
    window.location.href = '/dashboard';
  }

  return (
    <div className="shell">
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">Q</span>
          {!collapsed && <span>QalaGo</span>}
        </div>

        {business && !collapsed && (
          <div className="business-card">
            {business.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.coverImageUrl}
                alt=""
                className="business-card-thumb"
              />
            ) : (
              <div className="business-card-thumb placeholder">
                {businessInitials(business.title)}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div className="business-card-title">{business.title}</div>
              <div className="business-card-status">
                <span className="status-dot" />
                {statusLabel(business.status)}
              </div>
            </div>
          </div>
        )}

        {businesses.length > 1 && !collapsed && (
          <div style={{ padding: '0 12px 12px' }}>
            <select
              value={business?.id ?? ''}
              onChange={(e) => selectBusiness(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: '0.85rem',
              }}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              active={activeNav === item.id}
              businessId={business?.id}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          {FOOTER_NAV.map((item) => (
            <NavLink
              key={`footer-${item.id}`}
              item={item}
              active={activeNav === item.id}
              businessId={business?.id}
              collapsed={collapsed}
            />
          ))}
          <button type="button" className="collapse-btn" onClick={() => setCollapsed((v) => !v)}>
            <span className="nav-icon">{collapsed ? '»' : '«'}</span>
            {!collapsed && <span>Свернуть меню</span>}
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="city-picker">
              <span>📍</span>
              <span>{business?.city?.nameRu ?? cityName}</span>
            </div>
          </div>
          <div className="topbar-right">
            <Link href="/messages" className="icon-btn" aria-label="Уведомления" title="Сообщения">
              🔔
              {unreadCount > 0 && (
                <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </Link>
            <div className="user-chip">
              <div className="user-avatar">
                {business ? businessInitials(business.title) : 'Q'}
              </div>
              <div className="user-meta">
                <strong>{business?.title ?? userName ?? 'Кабинет'}</strong>
                <span>{userName ?? 'Владелец'}</span>
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

function NavLink({
  item,
  active,
  businessId,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  businessId?: string;
  collapsed: boolean;
}) {
  const className = `nav-item${active ? ' active' : ''}${item.soon ? ' disabled' : ''}`;
  const needsBusiness =
    item.href &&
    !['home', 'stats', 'messages', 'plan', 'help'].includes(item.id);

  if (item.soon || !item.href || (needsBusiness && !businessId)) {
    return (
      <span className={className} title={item.soon ? 'Скоро' : item.label}>
        <span className="nav-icon">{item.icon}</span>
        {!collapsed && (
          <>
            <span>{item.label}</span>
            {item.soon && (
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.7 }}>скоро</span>
            )}
          </>
        )}
      </span>
    );
  }

  return (
    <Link href={item.href(businessId ?? '')} className={className}>
      <span className="nav-icon">{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function useSelectedBusiness(businesses: BusinessRow[]): BusinessRow | null {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (businesses.length === 0) {
      setSelectedId(null);
      return;
    }
    const stored = localStorage.getItem(SELECTED_BUSINESS_KEY);
    const match = businesses.find((b) => b.id === stored);
    const id = match?.id ?? businesses[0].id;
    localStorage.setItem(SELECTED_BUSINESS_KEY, id);
    setSelectedId(id);
  }, [businesses]);

  return businesses.find((b) => b.id === selectedId) ?? businesses[0] ?? null;
}
