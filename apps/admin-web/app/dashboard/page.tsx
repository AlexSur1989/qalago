'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuthUser, BusinessRow, TOKEN_KEY } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [citySlug, setCitySlug] = useState('uralsk');
  const [pending, setPending] = useState<BusinessRow[]>([]);
  const [all, setAll] = useState<BusinessRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const me = await adminApi.getMe(token);
        setUser(me);
        if (me.role === 'CITY_ADMIN' && me.managedCity?.slug) {
          setCitySlug(me.managedCity.slug);
        }
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [pendingRes, allRes] = await Promise.all([
          adminApi.listBusinesses(token, citySlug, 'PENDING'),
          adminApi.listBusinesses(token, citySlug),
        ]);
        setPending(pendingRes.items);
        setAll(allRes.items);
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [token, citySlug]);

  async function setStatus(id: string, status: string) {
    if (!token) return;
    await adminApi.updateStatus(token, id, status);
    const pendingRes = await adminApi.listBusinesses(token, citySlug, 'PENDING');
    const allRes = await adminApi.listBusinesses(token, citySlug);
    setPending(pendingRes.items);
    setAll(allRes.items);
  }

  if (!token) return <p style={{ padding: 24 }}>Загрузка…</p>;

  const cityLabel =
    user?.managedCity?.nameRu ??
    (citySlug === 'aktobe' ? 'Актобе' : 'Уральск');

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>
          Модерация · QalaGo
          {isCityAdmin ? ` · ${cityLabel}` : ''}
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {cityLocked ? (
            <span style={{ fontSize: 14, color: '#666' }}>Город: {cityLabel}</span>
          ) : (
            <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} style={{ padding: 8 }}>
              <option value="uralsk">Уральск</option>
              <option value="aktobe">Актобе</option>
            </select>
          )}
          <button
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              router.push('/login');
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <section style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h2>Ожидают модерации ({pending.length})</h2>
        {pending.length === 0 ? (
          <p>Нет заявок</p>
        ) : (
          pending.map((b) => (
            <div key={b.id} style={{ borderTop: '1px solid #eee', padding: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong>{b.title}</strong>
                <div style={{ color: '#666', fontSize: 14 }}>{b.address}</div>
                <div style={{ fontSize: 13 }}>Владелец: {b.owner?.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStatus(b.id, 'ACTIVE')}>Одобрить</button>
                <button onClick={() => setStatus(b.id, 'BLOCKED')}>Отклонить</button>
              </div>
            </div>
          ))
        )}
      </section>

      <section style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
        <h2>Все заведения ({all.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: 8 }}>Название</th>
              <th>Статус</th>
              <th>Город</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {all.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 8 }}>{b.title}</td>
                <td>{b.status}</td>
                <td>{b.city?.nameRu}</td>
                <td>
                  {b.status === 'ACTIVE' ? (
                    <button onClick={() => setStatus(b.id, 'BLOCKED')}>Блок</button>
                  ) : (
                    <button onClick={() => setStatus(b.id, 'ACTIVE')}>Активировать</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
