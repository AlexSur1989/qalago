'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { BackofficeSkipLink, useShellDrawerA11y } from '@qalago/brand/accessibility';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthUser } from '@/lib/api';
import { AdminTabId } from '@/lib/admin-utils';
import {
  showAdminAuditNav,
  showAdminSettingsNav,
  showAdminStaffNav,
} from '@/lib/admin-shell-nav';
import { canManageCities, canViewUsers, getRoleDefinition } from '@/lib/rbac';
import type { MonetizationSubNavId } from '@/lib/monetization-utils';
import { BackofficeNavIcon, QalaIcon } from '@qalago/brand/icons';
import { ADMIN_SHELL_ROUTE_ICONS, ADMIN_TAB_ICONS } from '@/lib/admin-shell-icons';

type NavItem = {
  id: AdminTabId;
  label: string;
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useShellDrawerA11y(mobileNavOpen, menuButtonRef, sidebarRef);

  const monetizationBadgeTotal =
    (monetizationBadges?.orders ?? 0) + (monetizationBadges?.creatives ?? 0);

  const businessRequestsBadgeTotal =
    (businessRequestBadges?.applications ?? 0) + (businessRequestBadges?.claims ?? 0);

  const nav: NavItem[] = [
    { id: 'moderation', label: 'Модерация', badge: badges.pending || null },
    { id: 'featured', label: 'VIP / Топ', badge: badges.featured || null },
    { id: 'reviews', label: 'Отзывы', badge: badges.reviews || null },
    { id: 'monetization', label: 'Монетизация', badge: monetizationBadgeTotal || null },
    { id: 'categories', label: 'Категории' },
    { id: 'content', label: 'AI-черновики' },
    { id: 'users', label: 'Пользователи', visible: canViewUsers(user.role) },
    { id: 'cities', label: 'Города', visible: canManageCities(user.role) },
  ];

  const cityLabel =
    user.managedCity?.nameRu ??
    cities.find((c) => c.slug === citySlug)?.nameRu ??
    citySlug;

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

  const sidebarClassName = useMemo(() => {
    let cls = 'sidebar';
    if (mobileNavOpen) cls += ' open';
    return cls;
  }, [mobileNavOpen]);

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  function linkClass(active: boolean): string {
    return `nav-item${active ? ' active' : ''}`;
  }

  return (
    <div className="shell">
      <BackofficeSkipLink href="#admin-main-content">Перейти к основному содержимому</BackofficeSkipLink>
      {mobileNavOpen ? (
        <button
          type="button"
          className="shell-nav-backdrop mobile-only"
          aria-label="Закрыть меню"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside ref={sidebarRef} className={sidebarClassName} aria-label="Админ-навигация">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">Q</span>
          <span>QalaGo Admin</span>
          {mobileNavOpen ? (
            <button
              type="button"
              className="sidebar-close-btn mobile-only"
              aria-label="Закрыть меню"
              onClick={closeMobileNav}
            >
              <QalaIcon name="close" size="md" decorative />
            </button>
          ) : null}
        </div>

        <div className="admin-role-card">
          <div className="admin-role-title">{roleInfo.labelRu}</div>
          <div className="admin-role-meta">{user.phone ?? 'Телефон не указан'}</div>
        </div>

        <nav id="admin-sidebar-nav" className="sidebar-nav" aria-label="Разделы админки">
          {nav
            .filter((item) => item.visible !== false)
            .map((item) =>
              item.id === 'monetization' ? (
                <Link
                  key={item.id}
                  href="/monetization"
                  className={linkClass(
                    activeTab === 'monetization' || pathname.startsWith('/monetization'),
                  )}
                  aria-current={
                    activeTab === 'monetization' || pathname.startsWith('/monetization')
                      ? 'page'
                      : undefined
                  }
                  onClick={closeMobileNav}
                >
                  <BackofficeNavIcon name={ADMIN_TAB_ICONS[item.id]} />
                  <span>{item.label}</span>
                  {item.badge != null && item.badge !== 0 ? (
                    <span className="nav-badge">{item.badge}</span>
                  ) : null}
                </Link>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className={linkClass(activeTab === item.id)}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  onClick={() => {
                    closeMobileNav();
                    onTabChange(item.id);
                  }}
                >
                  <BackofficeNavIcon name={ADMIN_TAB_ICONS[item.id]} />
                  <span>{item.label}</span>
                  {item.badge != null && item.badge !== 0 ? (
                    <span className="nav-badge">{item.badge}</span>
                  ) : null}
                </button>
              ),
            )}
          <Link
            href="/catalog/businesses"
            className={linkClass(pathname.startsWith('/catalog/businesses'))}
            aria-current={pathname.startsWith('/catalog/businesses') ? 'page' : undefined}
            onClick={closeMobileNav}
          >
            <BackofficeNavIcon name={ADMIN_SHELL_ROUTE_ICONS['catalog-businesses']} />
            <span>Каталог · Заведения</span>
          </Link>
          <Link
            href="/business-requests/applications"
            className={linkClass(pathname.startsWith('/business-requests'))}
            aria-current={pathname.startsWith('/business-requests') ? 'page' : undefined}
            onClick={closeMobileNav}
          >
            <BackofficeNavIcon name={ADMIN_SHELL_ROUTE_ICONS['business-requests']} />
            <span>Заявки бизнеса</span>
            {businessRequestsBadgeTotal > 0 ? (
              <span className="nav-badge">{businessRequestsBadgeTotal}</span>
            ) : null}
          </Link>
          <Link
            href="/moderation/cases"
            className={linkClass(pathname.startsWith('/moderation'))}
            aria-current={pathname.startsWith('/moderation') ? 'page' : undefined}
            onClick={closeMobileNav}
          >
            <BackofficeNavIcon name={ADMIN_SHELL_ROUTE_ICONS['moderation-ugc']} />
            <span>Модерация UGC</span>
            {moderationCaseBadge != null && moderationCaseBadge > 0 ? (
              <span className="nav-badge">{moderationCaseBadge}</span>
            ) : null}
          </Link>
          <Link
            href="/legal/documents"
            className={linkClass(pathname.startsWith('/legal'))}
            aria-current={pathname.startsWith('/legal') ? 'page' : undefined}
            onClick={closeMobileNav}
          >
            <BackofficeNavIcon name={ADMIN_SHELL_ROUTE_ICONS.legal} />
            <span>Legal</span>
            {legalDataRequestBadge != null && legalDataRequestBadge > 0 ? (
              <span className="nav-badge">{legalDataRequestBadge}</span>
            ) : null}
          </Link>
          <Link
            href="/reports"
            className={linkClass(pathname.startsWith('/reports'))}
            aria-current={pathname.startsWith('/reports') ? 'page' : undefined}
            onClick={closeMobileNav}
          >
            <BackofficeNavIcon name={ADMIN_SHELL_ROUTE_ICONS.reports} />
            <span>Отчёты</span>
          </Link>
          {showAdminStaffNav(user.role) ? (
            <Link
              href="/staff"
              className={linkClass(pathname.startsWith('/staff'))}
              aria-current={pathname.startsWith('/staff') ? 'page' : undefined}
              onClick={closeMobileNav}
            >
              <BackofficeNavIcon name={ADMIN_SHELL_ROUTE_ICONS.staff} />
              <span>Staff / RBAC</span>
            </Link>
          ) : null}
          {showAdminAuditNav(user.role) ? (
            <Link
              href="/audit-logs"
              className={linkClass(pathname.startsWith('/audit-logs'))}
              aria-current={pathname.startsWith('/audit-logs') ? 'page' : undefined}
              onClick={closeMobileNav}
            >
              <BackofficeNavIcon name={ADMIN_SHELL_ROUTE_ICONS.audit} />
              <span>Аудит</span>
            </Link>
          ) : null}
          {showAdminSettingsNav(user.role) ? (
            <Link
              href="/settings/security"
              className={linkClass(pathname.startsWith('/settings'))}
              aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
              onClick={closeMobileNav}
            >
              <BackofficeNavIcon name={ADMIN_SHELL_ROUTE_ICONS.settings} />
              <span>Настройки</span>
            </Link>
          ) : null}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              ref={menuButtonRef}
              type="button"
              className="icon-btn mobile-only"
              aria-expanded={mobileNavOpen}
              aria-controls="admin-sidebar-nav"
              aria-label="Открыть меню"
              onClick={() => setMobileNavOpen(true)}
            >
              <QalaIcon name="menu" size="md" decorative />
            </button>
            {cityLocked ? (
              <div className="city-picker" title={cityLabel}>
                <QalaIcon name="location" size="md" decorative />
                <span>{cityLabel}</span>
              </div>
            ) : (
              <label className="city-picker">
                <QalaIcon name="location" size="md" decorative />
                <select
                  value={citySlug}
                  onChange={(e) => onCityChange(e.target.value)}
                  className="city-select"
                  aria-label="Город"
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
              <div className="user-avatar" aria-hidden>
                A
              </div>
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
        <main id="admin-main-content" className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
