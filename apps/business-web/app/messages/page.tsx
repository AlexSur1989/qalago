'use client';

import { useLocale, useUi, type UiLabels } from '@/components/locale-provider';
import { parseApiError } from '@/lib/monetization-utils';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BackofficeSearchField } from '@qalago/brand/tables';
import { BusinessRow, NotificationRow, myBusinessRows, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';
import {
  formatNotificationsCountLabel,
  formatOwnerDateTime,
} from '@/lib/presentation';
import { presentBusinessNotification } from '@/lib/notification-presentation';
import { resolveBusinessNotificationHref } from '@/lib/business-notification-navigation';
import {
  BackofficeAlert,
  BackofficeEmptyState,
  BackofficeErrorState,
  BackofficeLoadingState,
} from '@qalago/brand/states';

function typeLabel(ui: UiLabels, type: string) {
  const map: Record<string, string> = {
    NEW_REVIEW: ui.__fe2c89,
    REVIEW_NEW: ui.__fe2c89,
    REVIEW_REPLY: ui.___6e031d,
    REVIEW_HIDDEN: ui.text_424b69,
    REVIEW_RESTORED: ui.text_424b69,
    BUSINESS_APPLICATION_APPROVED: ui.text_50df78,
    BUSINESS_APPLICATION_REJECTED: ui.text_50df78,
    OWNERSHIP_CLAIM_APPROVED: ui.text_50df78,
    OWNERSHIP_CLAIM_REJECTED: ui.text_50df78,
    BUSINESS_INVITATION_RECEIVED: ui.text_50df78,
    BUSINESS_INVITATION_ACCEPTED: ui.text_50df78,
    AD_CAMPAIGN_APPROVED: ui.text_df0d49,
    AD_CAMPAIGN_REJECTED: ui.text_df0d49,
    MODERATION: ui.text_424b69,
    PROMOTION: ui.text_df0d49,
    GENERAL: ui.text_50df78,
  };
  return map[type] ?? type.replaceAll('_', ' ');
}

export default function MessagesPage() {
  const locale = useLocale();
  const ui = useUi();

  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const business = useSelectedBusiness(businesses);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function load(t: string) {
    setLoading(true);
    try {
      const list = await ownerApi.listNotifications(t, 1, 50);
      setItems(list.items);
      setError(null);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    ownerApi
      .listMyBusinesses(token)
      .then((res) => setBusinesses(myBusinessRows(res.items)))
      .catch((err) => setError(parseApiError(locale, err)));
    load(token);
  }, [token]);

  async function markRead(id: string) {
    if (!token) return;
    await ownerApi.markNotificationRead(token, id);
    await load(token);
  }

  async function markAllRead() {
    if (!token) return;
    await ownerApi.markAllNotificationsRead(token);
    await load(token);
  }

  if (!ready || !token) {
    return (
      <div className="page-content">
        <BackofficeLoadingState density="page" label={ui.text_89d69a} />
      </div>
    );
  }

  const unread = items.filter((n) => !n.isRead).length;
  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const display = presentBusinessNotification(item, locale);
      const haystack = `${display.title} ${display.body ?? ''} ${typeLabel(ui, item.type)}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, searchQuery, locale, ui]);

  return (
    <BusinessShell
      activeNav="messages"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>{ui.ownerNavMessages}</h1>
          <p className="page-header-meta">
            {formatNotificationsCountLabel(locale, items.length)}
            {unread > 0 ? ui.text_09543f : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={markAllRead}>{ui.__ed0248}</button>
          )}
          <Link href="/dashboard" className="btn">{ui.__65f9d8}</Link>
        </div>
      </header>

      {error && !loading ? (
        <BackofficeErrorState
          title={ui.ownerMessagesLoadError}
          message={error}
          onRetry={() => token && load(token)}
          retryLabel={ui.text_b914bb}
        />
      ) : null}

      <section className="form-card" style={{ maxWidth: 820 }}>
        {!loading && !error && items.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <BackofficeSearchField
              label={ui.tableSearchMessagesLabel}
              placeholder={ui.tableSearchMessagesLabel}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        ) : null}
        {loading ? (
          <BackofficeLoadingState density="section" label={ui.text_89d69a} />
        ) : !error && items.length === 0 ? (
          <BackofficeEmptyState
            title={ui.ownerNavMessages}
            description={ui.____d078b3}
            icon="notification"
            density="section"
          />
        ) : !error && visibleItems.length === 0 && items.length > 0 ? (
          <BackofficeEmptyState
            title={ui.tableEmptyFilteredMenu}
            actions={
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSearchQuery('')}>
                {ui.tableResetFilters}
              </button>
            }
            icon="notification"
            density="section"
          />
        ) : !error ? (
          visibleItems.map((item) => {
            const display = presentBusinessNotification(item, locale);
            const href = resolveBusinessNotificationHref(item);
            const inner = (
              <>
                <div className="promo-thumb">💬</div>
                <div className="promo-body" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong>{display.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatOwnerDateTime(locale, item.createdAt)}
                    </span>
                  </div>
                  {display.body && (
                    <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>{display.body}</p>
                  )}
                  <span className="notification-type">{typeLabel(ui, item.type)}</span>
                </div>
              </>
            );

            async function onActivate() {
              if (!item.isRead) {
                await markRead(item.id);
              }
            }

            if (href) {
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`promo-item notification-item${item.isRead ? '' : ' unread'}`}
                  style={{ alignItems: 'flex-start', textDecoration: 'none', color: 'inherit' }}
                  onClick={() => {
                    void onActivate();
                  }}
                >
                  {inner}
                </Link>
              );
            }

            if (item.isRead) {
              return (
                <article
                  key={item.id}
                  className="promo-item notification-item"
                  style={{ alignItems: 'flex-start' }}
                >
                  {inner}
                </article>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                className="promo-item notification-item unread"
                style={{
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  font: 'inherit',
                  textAlign: 'left',
                  width: '100%',
                }}
                onClick={() => {
                  void onActivate();
                }}
              >
                {inner}
              </button>
            );
          })
        ) : null}
      </section>
    </BusinessShell>
  );
}
