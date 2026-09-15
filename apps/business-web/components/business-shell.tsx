'use client';

import { LocaleSwitcher } from '@/components/locale-switcher';
import { cityDisplayName } from '@/lib/localized-content';
import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { BusinessRow, SELECTED_BUSINESS_KEY, ownerApi } from '@/lib/api';
import {
  buildFooterNavItems,
  buildMainNavItems,
  type BusinessNavItem,
  type NavId,
} from '@/lib/business-access';
import { getWebAccessToken } from '@/lib/web-auth-token';
import { businessInitials, statusLabel } from '@/lib/business-utils';

export type { NavId };

type BusinessShellProps = {
  activeNav: NavId;
  business: BusinessRow | null;
  businesses: BusinessRow[];
  cityName?: string;
  userName?: string;
  onLogout: () => void;
  children: ReactNode;
  mainNav?: BusinessNavItem[];
  footerNav?: BusinessNavItem[];
};

export function BusinessShell({
  activeNav,
  business,
  businesses,
  cityName,
  userName,
  onLogout,
  children,
  mainNav,
  footerNav,
}: BusinessShellProps) {
  const locale = useLocale();
  const ui = useUi();
  const pathname = usePathname();
  const defaultCity = cityName ?? ui.text_e640a8;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = mainNav ?? buildMainNavItems(locale);
  const footerNavItems = footerNav ?? buildFooterNavItems(locale);

  const effectiveCollapsed = collapsed && !mobileNavOpen;

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    const token = getWebAccessToken();
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

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  const sidebarClassName = useMemo(() => {
    let cls = 'sidebar';
    if (mobileNavOpen) cls += ' open';
    if (effectiveCollapsed) cls += ' collapsed';
    return cls;
  }, [mobileNavOpen, effectiveCollapsed]);

  return (
    <div className="shell">
      {mobileNavOpen && (
        <button
          type="button"
          className="shell-nav-backdrop mobile-only"
          aria-label={ui.shellCloseNavigation}
          onClick={closeMobileNav}
        />
      )}

      <aside className={sidebarClassName}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">Q</span>
          {!effectiveCollapsed && <span>QalaGo</span>}
          {mobileNavOpen && (
            <button
              type="button"
              className="sidebar-close-btn mobile-only"
              aria-label={ui.shellCloseNavigation}
              onClick={closeMobileNav}
            >
              ×
            </button>
          )}
        </div>

        {business && !effectiveCollapsed && (
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
                {statusLabel(locale, business.status)}
              </div>
            </div>
          </div>
        )}

        {businesses.length > 1 && !effectiveCollapsed && (
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
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              active={activeNav === item.id}
              businessId={business?.id}
              collapsed={effectiveCollapsed}
              onNavigate={closeMobileNav}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          {footerNavItems.map((item) => (
            <NavLink
              key={`footer-${item.id}`}
              item={item}
              active={activeNav === item.id}
              businessId={business?.id}
              collapsed={effectiveCollapsed}
              onNavigate={closeMobileNav}
            />
          ))}
          <button
            type="button"
            className="collapse-btn desktop-only"
            onClick={() => setCollapsed((v) => !v)}
          >
            <span className="nav-icon">{collapsed ? '»' : '«'}</span>
            {!effectiveCollapsed && <span>{ui.shellCollapseMenu}</span>}
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-btn mobile-only"
              aria-expanded={mobileNavOpen}
              aria-label={ui.shellOpenNavigation}
              onClick={() => setMobileNavOpen(true)}
            >
              ☰
            </button>
            <div className="city-picker">
              <span>📍</span>
              <span>
                {business?.city
                  ? cityDisplayName(
                      { nameRu: business.city.nameRu, nameKk: business.city.nameKk },
                      locale,
                    )
                  : defaultCity}
              </span>
            </div>
          </div>
          <div className="topbar-right">
            <LocaleSwitcher locale={locale} labels={ui} />
            <Link href="/messages" className="icon-btn" aria-label={ui.ownerNavMessages} title={ui.ownerNavMessages}>
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
                <strong>{business?.title ?? userName ?? ui.text_da78ed}</strong>
                <span>{userName ?? ui.text_e093c1}</span>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
              {ui.shellLogout}
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
  onNavigate,
}: {
  item: BusinessNavItem;
  active: boolean;
  businessId?: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const ui = useUi();
  const className = `nav-item${active ? ' active' : ''}${item.soon ? ' disabled' : ''}`;
  const needsBusiness =
    item.href &&
    !['home', 'stats', 'messages', 'plan', 'monetization', 'help', 'settings'].includes(item.id);

  if (item.soon || !item.href || (needsBusiness && !businessId)) {
    return (
      <span className={className} title={item.soon ? ui.text_7d2cdd : item.label}>
        <span className="nav-icon">{item.icon}</span>
        {!collapsed && (
          <>
            <span>{item.label}</span>
            {item.soon && (
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.7 }}>
                {ui.shellSoonBadge}
              </span>
            )}
          </>
        )}
      </span>
    );
  }

  return (
    <Link href={item.href(businessId ?? '')} className={className} onClick={() => onNavigate?.()}>
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
