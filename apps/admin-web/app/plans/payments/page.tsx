'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { MonetizationSubNav } from '@/components/monetization/monetization-subnav';
import { useAuth } from '@/lib/use-auth';
import { adminApi, CityRow } from '@/lib/api';
import { AdminPlanPaymentRow, plansAdminApi } from '@/lib/plans-api';
import { formatDateTime, formatKzt, parseApiError } from '@/lib/monetization-utils';

export default function AdminPlanPaymentsPage() {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [rows, setRows] = useState<AdminPlanPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await plansAdminApi.listPayments(token, {
        citySlug,
        status: status || undefined,
        limit: 50,
      });
      setRows(res.items);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, citySlug, status]);

  useEffect(() => {
    adminApi.listCities().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmRow(id: string) {
    if (!token) return;
    setActingId(id);
    try {
      await plansAdminApi.confirmPayment(token, id);
      await load();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActingId(null);
    }
  }

  async function cancelRow(id: string) {
    if (!token) return;
    setActingId(id);
    try {
      await plansAdminApi.cancelPayment(token, id);
      await load();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActingId(null);
    }
  }

  if (!ready || !token || !user) {
    return <p className="page-content">Загрузка…</p>;
  }

  const cityLabel = cities.find((c) => c.slug === citySlug)?.nameRu ?? citySlug;

  return (
    <AdminShell
      activeTab="monetization"
      onTabChange={(tab) => router.push(tab === 'monetization' ? '/monetization' : '/dashboard')}
      user={user}
      citySlug={citySlug}
      cities={cities.length ? cities : [{ slug: citySlug, nameRu: cityLabel }]}
      cityLocked={user.role === 'CITY_ADMIN' && !!user.managedCity?.slug}
      onCityChange={setCitySlug}
      badges={{ pending: 0, featured: 0, reviews: 0 }}
      onLogout={logout}
    >
      <MonetizationSubNav />
      <div className="page-header">
        <h1>Оплаты тарифов</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Отдельно от рекламных платежей (`/monetization/payments`).
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <label>
          Статус
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="FAILED">FAILED</option>
            <option value="">Все</option>
          </select>
        </label>
      </section>

      <section className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Бизнес</th>
                <th>Тариф</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Создано</th>
                <th>Оплачено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.business.title}
                    <br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {row.business.city?.nameRu ?? '—'}
                    </span>
                  </td>
                  <td>{row.tier}</td>
                  <td>{formatKzt(row.amountKzt)}</td>
                  <td>{row.status}</td>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td>{row.paidAt ? formatDateTime(row.paidAt) : '—'}</td>
                  <td>
                    {row.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={actingId === row.id}
                          onClick={() => confirmRow(row.id)}
                        >
                          Подтвердить
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={actingId === row.id}
                          onClick={() => cancelRow(row.id)}
                        >
                          Отменить
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminShell>
  );
}
