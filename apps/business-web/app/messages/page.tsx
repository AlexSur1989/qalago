'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BusinessRow, NotificationRow, ownerApi } from '@/lib/api';
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

function typeLabel(type: string) {
  const map: Record<string, string> = {
    REVIEW_NEW: 'Новый отзыв',
    REVIEW_REPLY: 'Ответ на отзыв',
    MODERATION: 'Модерация',
    PROMOTION: 'Акция',
    GENERAL: 'Общее',
  };
  return map[type] ?? type.replaceAll('_', ' ');
}

export default function MessagesPage() {
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
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    ownerApi
      .listMyBusinesses(token)
      .then(setBusinesses)
      .catch((err) => setError(String(err)));
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

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

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
          <h1>Сообщения</h1>
          <p className="page-header-meta">
            {items.length} уведомлений
            {unread > 0 ? ` · ${unread} непрочитанных` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={markAllRead}>
              Прочитать все
            </button>
          )}
          <Link href="/dashboard" className="btn">
            ← На главную
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ maxWidth: 820 }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Пока нет уведомлений. Здесь появятся новые отзывы, статусы модерации и другие события.
          </p>
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
                <span className="notification-type">{typeLabel(item.type)}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </BusinessShell>
  );
}
