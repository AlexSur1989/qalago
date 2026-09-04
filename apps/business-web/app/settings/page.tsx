'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { BusinessRow, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';

export default function SettingsPage() {
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const business = useSelectedBusiness(businesses);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then(setBusinesses).catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  async function saveAccount(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await ownerApi.updateMe(token, {
        name: name.trim() || undefined,
      });
      setName(updated.name ?? '');
      setMessage('Имя аккаунта сохранено');
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  return (
    <BusinessShell
      activeNav="settings"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Настройки</h1>
          <p className="page-header-meta">Аккаунт и управление заведением</p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <section className="form-card" style={{ maxWidth: 560, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Аккаунт</h3>
        <form onSubmit={saveAccount} className="form-grid">
          <label>
            Телефон
            <input value={user?.phone ?? ''} readOnly disabled />
          </label>
          <label>
            Имя владельца
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как отображать в кабинете"
            />
          </label>
          <div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </section>

      <section className="form-card" style={{ maxWidth: 560, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Заведение</h3>
        {business ? (
          <>
            <p style={{ margin: '0 0 12px', color: 'var(--text-muted)' }}>
              Редактируйте карточку, часы работы и контакты в профиле заведения.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href={`/business/${business.id}`} className="btn btn-primary">
                Профиль заведения
              </Link>
              <Link href={`/business/${business.id}/media`} className="btn">
                Фото и видео
              </Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', color: 'var(--text-muted)' }}>
              У вас пока нет заведения. Подайте заявку — после модерации она появится в приложении.
            </p>
            <Link href="/register" className="btn btn-primary">
              Зарегистрировать заведение
            </Link>
          </>
        )}
      </section>

      <section className="form-card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginTop: 0 }}>Безопасность</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Вход по одноразовому SMS-коду. Для смены номера телефона обратитесь в поддержку.
        </p>
      </section>
    </BusinessShell>
  );
}
