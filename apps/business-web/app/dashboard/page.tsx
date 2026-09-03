'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessRow, ownerApi, TOKEN_KEY } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

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
        const items = await ownerApi.listMyBusinesses(token);
        setBusinesses(items);
        const summaryEntries = await Promise.all(
          items.map(async (b) => {
            try {
              const s = await ownerApi.analyticsSummary(token, b.id);
              return [b.id, s.total] as const;
            } catch {
              return [b.id, 0] as const;
            }
          }),
        );
        setStats(Object.fromEntries(summaryEntries));
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [token]);

  if (!token) return <p style={{ padding: 24 }}>Загрузка…</p>;

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Кабинет бизнеса · QalaGo</h1>
        <button
          onClick={() => {
            localStorage.removeItem(TOKEN_KEY);
            router.push('/login');
          }}
        >
          Выйти
        </button>
      </header>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {businesses.length === 0 ? (
        <p>Нет заведений. Создайте через мобильное приложение.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {businesses.map((b) => (
            <section
              key={b.id}
              style={{ background: '#fff', borderRadius: 12, padding: 16 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px' }}>{b.title}</h2>
                  <div style={{ color: '#666', fontSize: 14 }}>{b.status} · {b.address}</div>
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    Просмотры за 30 дней: <strong>{stats[b.id] ?? '—'}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <Link href={`/business/${b.id}`} style={linkBtn}>Профиль</Link>
                  <Link href={`/business/${b.id}/promotions`} style={linkBtn}>Акции</Link>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

const linkBtn: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  background: '#1e6bd6',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 14,
};
