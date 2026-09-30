'use client';

import { LocaleSwitcher } from '@/components/locale-switcher';
import { cityDisplayName } from '@/lib/localized-content';
import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { BusinessRow, SELECTED_BUSINESS_KEY, ownerApi } from '@/lib/api';
import {
  buildPermissionScopedShellNav,
  type BusinessNavItem,
  type NavId,
} from '@/lib/business-access';
import {
  readStoredSelectedBusinessId,
  resolveSelectedBusinessRowId,
  syncSelectedBusinessStorageForRows,
} from '@/lib/business-selection';
import { useBusinessAccess } from '@/lib/use-business-access';
import { usePlatformFeatures } from '@/components/platform-features-provider';
import { useAuth } from '@/lib/use-auth';
import { getWebAccessToken } from '@/lib/web-auth-token';
import { businessInitials, statusLabel } from '@/lib/business-utils';
import { BackofficeNavIcon, QalaIcon } from '@qalago/brand/icons';
import { BackofficeSkipLink, useShellDrawerA11y } from '@qalago/brand/accessibility';

export type { NavId };

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
  cityName,
  userName,
  onLogout,
  children,
}: BusinessShellProps) {
  const locale = useLocale();
  const ui = useUi();
  const pathname = usePathname();
  const defaultCity = cityName ?? ui.text_e640a8;
  const { access, ready: authReady } = useBusinessAccess();
  const { features: platformFeatures, ready: platformReady } = usePlatformFeatures();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useShellDrawerA11y(mobileNavOpen, menuButtonRef, sidebarRef);

  const platformNav = platformReady ? platformFeatures : { businessTeamEnabled: false };
  const { mainNav: navItems, footerNav: footerNavItems } = useMemo(
    () => buildPermissionScopedShellNav(locale, authReady ? access : null, platformNav),
    [locale, access, authReady, platformNav],
  );

  const effectiveCollapsed = collapsed && !mobileNavOpen;

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      document.body.classList.remove('shell-drawer-open');
      return;
    }
    document.body.classList.add('shell-drawer-open');
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('shell-drawer-open');
      window.removeEventListener('keydown', onKeyDown);
    };
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

  const messagesAriaLabel =
    unreadCount > 0 ? `${ui.ownerNavMessages} (${unreadCount})` : ui.ownerNavMessages;

  return (
    <div className="shell business-shell">
      <BackofficeSkipLink href="#business-main-content">{ui.shellSkipToMainContent}</BackofficeSkipLink>
      {mobileNavOpen && (
        <button
          type="button"
          className="shell-nav-backdrop mobile-only"
          aria-label={ui.shellCloseNavigation}
          onClick={closeMobileNav}
        />
      )}

      <aside ref={sidebarRef} className={sidebarClassName} aria-label="QalaGo business navigation">
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
              <QalaIcon name="close" size="md" decorative />
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
          <div className="business-switcher">
            <select
              value={business?.id ?? ''}
              onChange={(e) => selectBusiness(e.target.value)}
              aria-label={ui.text_da78ed}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav id="business-sidebar-nav" className="sidebar-nav" aria-label={ui.ownerNavOverview}>
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
            aria-label={ui.shellCollapseMenu}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((v) => !v)}
          >
            <span className="nav-icon" aria-hidden>
              <QalaIcon
                name={collapsed ? 'chevron-right' : 'chevron-left'}
                size="md"
                decorative
              />
            </span>
            {!effectiveCollapsed && <span>{ui.shellCollapseMenu}</span>}
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              ref={menuButtonRef}
              type="button"
              className="icon-btn mobile-only"
              aria-expanded={mobileNavOpen}
              aria-controls="business-sidebar-nav"
              aria-label={ui.shellOpenNavigation}
              onClick={() => setMobileNavOpen(true)}
            >
              <QalaIcon name="menu" size="md" decorative />
            </button>
            <div className="city-picker">
              <QalaIcon name="location" size="md" decorative />
              <span>
                {business?.city
                  ? cityDisplayName(
                      { nameRu: business.city.nameRu, nameKk: business.city.nameKk },
                      locale,
                    )
                  : defaultCity}
              </span>
            </div>
            {business ? (
              <span className="topbar-entity-title" title={business.title}>
                {business.title}
              </span>
            ) : null}
          </div>
          <div className="topbar-right">
            <div className="topbar-locale">
              <LocaleSwitcher locale={locale} labels={ui} />
            </div>
            <Link
              href="/messages"
              className="icon-btn"
              aria-label={messagesAriaLabel}
              title={messagesAriaLabel}
            >
              <QalaIcon name="notification" size="md" decorative />
              {unreadCount > 0 && (
                <span className="badge" aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="user-chip">
              <div className="user-avatar" aria-hidden="true">
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
        <main id="business-main-content" className="page-content">
          {children}
        </main>
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
        <BackofficeNavIcon name={item.icon} />
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
    <Link
      href={item.href(businessId ?? '')}
      className={className}
      aria-current={active ? 'page' : undefined}
      onClick={() => onNavigate?.()}
    >
      <BackofficeNavIcon name={item.icon} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function useSelectedBusiness(businesses: BusinessRow[]): BusinessRow | null {
  const { ready } = useAuth();

  const selectedId = useMemo(() => {
    if (!ready || businesses.length === 0) return null;
    return resolveSelectedBusinessRowId(businesses, readStoredSelectedBusinessId());
  }, [ready, businesses]);

  useEffect(() => {
    syncSelectedBusinessStorageForRows(ready, businesses);
  }, [ready, businesses]);

  if (!selectedId) return null;
  return businesses.find((b) => b.id === selectedId) ?? null;
}
