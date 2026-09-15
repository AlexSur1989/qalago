'use client';

import { useLocale, useUi, type UiLabels } from '@/components/locale-provider';
import { parseApiError } from '@/lib/monetization-utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BusinessRow, NotificationRow, myBusinessRows, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeLabel(ui: UiLabels, type: string) {
  const map: Record<string, string> = {
    REVIEW_NEW: ui.__fe2c89,
    REVIEW_REPLY: ui.___6e031d,
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

  async function load(t: string) {
    setLoading(true);
    try {
      const list = await ownerApi.listNotifications(t);
      setItems(list);
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

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  const unread = items.filter((n) => !n.isRead).length;

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
            {items.length} уведомлений
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

      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ maxWidth: 820 }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.text_89d69a}</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.____d078b3}</p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className={`promo-item notification-item${item.isRead ? '' : ' unread'}`}
              style={{ alignItems: 'flex-start', cursor: item.isRead ? 'default' : 'pointer' }}
              onClick={() => {
                if (!item.isRead) markRead(item.id);
              }}
              onKeyDown={(e) => {
                if (!item.isRead && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  markRead(item.id);
                }
              }}
              role={item.isRead ? undefined : 'button'}
              tabIndex={item.isRead ? undefined : 0}
            >
              <div className="promo-thumb">💬</div>
              <div className="promo-body" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{item.title}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                {item.body && (
                  <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>{item.body}</p>
                )}
                <span className="notification-type">{typeLabel(ui, item.type)}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </BusinessShell>
  );
}
