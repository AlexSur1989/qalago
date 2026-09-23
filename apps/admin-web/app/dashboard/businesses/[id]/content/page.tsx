'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import {
  adminBusinessContentApi,
  type AdminBusinessContentResponse,
} from '@/lib/admin-business-content-api';
import { statusClass, statusLabel } from '@/lib/admin-utils';
import { formatDateTime } from '@/lib/monetization-utils';
import {
  formatStaffBranchScopeSummary,
  staffBranchContentLabel,
} from '@/lib/staff-branch-content-labels';
import { adminApi, type CityRow } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';

export default function BusinessContentInspectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();

  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [data, setData] = useState<AdminBusinessContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;

  useEffect(() => {
    adminApi.listCities().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'CITY_ADMIN' && user.managedCity?.slug) {
      setCitySlug(user.managedCity.slug);
    }
  }, [user]);

  const load = useCallback(() => {
    if (!token) return Promise.resolve();
    setLoading(true);
    setError(null);
    return adminBusinessContentApi
      .getContent(token, params.id)
      .then(setData)
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [token, params.id]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  if (!ready || !token || !user) {
    return <p className="page-content">Загрузка…</p>;
  }

  const cityLabel =
    user.managedCity?.nameRu ??
    cities.find((c) => c.slug === citySlug)?.nameRu ??
    citySlug;

  return (
    <AdminShell
      activeTab="moderation"
      onTabChange={(tab) => {
        if (tab === 'monetization') {
          router.push('/monetization');
          return;
        }
        router.push('/dashboard');
      }}
      user={user}
      citySlug={citySlug}
      cities={cities.length > 0 ? cities : [{ slug: citySlug, nameRu: cityLabel }]}
      cityLocked={cityLocked}
      onCityChange={setCitySlug}
      badges={{ pending: 0, featured: 0, reviews: 0 }}
      onLogout={logout}
    >
      <div className="card" style={{ marginBottom: '1rem' }}>
        <Link href="/dashboard" className="text-link">
          ← Заведения
        </Link>
        <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.35rem' }}>
          {data?.business.title ?? 'Контент заведения'}
        </h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>
          {staffBranchContentLabel('ru', 'allBranches')} /{' '}
          {staffBranchContentLabel('kk', 'allBranches')} — только просмотр
        </p>
      </div>

      {loading && (
        <div className="card">
          <p>Загрузка…</p>
        </div>
      )}

      {error && (
        <div className="card">
          <p className="error-text">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ marginTop: 0 }}>Товары и услуги / Тауарлар мен қызметтер</h2>
            {data.serviceItems.length === 0 ? (
              <p className="muted">Нет позиций каталога.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                {data.serviceItems.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      borderTop: '1px solid var(--border-subtle, #eee)',
                      padding: '12px 0',
                    }}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      {item.section && (
                        <span className="muted"> · {item.section.title}</span>
                      )}
                    </div>
                    <div className="moderation-meta">
                      {item.isActive ? (
                        <span className="tag tag-success">Активна</span>
                      ) : (
                        <span className="tag tag-muted">Неактивна</span>
                      )}
                    </div>
                    <BranchScopeBlock scope={item.branchScope} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0 }}>Акции / Акциялар</h2>
            {data.promotions.length === 0 ? (
              <p className="muted">Нет акций.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                {data.promotions.map((promo) => (
                  <li
                    key={promo.id}
                    style={{
                      borderTop: '1px solid var(--border-subtle, #eee)',
                      padding: '12px 0',
                    }}
                  >
                    <div>
                      <strong>{promo.title}</strong>
                    </div>
                    <div className="moderation-meta">
                      <span className={statusClass(promo.status)}>
                        {statusLabel(promo.status)}
                      </span>
                      {promo.moderationHidden && (
                        <span className="tag tag-warning">Скрыта модерацией</span>
                      )}
                      {(promo.startDate || promo.endDate) && (
                        <span className="muted">
                          {' '}
                          ·{' '}
                          {promo.startDate
                            ? formatDateTime(promo.startDate)
                            : '—'}{' '}
                          —{' '}
                          {promo.endDate ? formatDateTime(promo.endDate) : '—'}
                        </span>
                      )}
                    </div>
                    <BranchScopeBlock scope={promo.branchScope} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}

function BranchScopeBlock({
  scope,
}: {
  scope: AdminBusinessContentResponse['serviceItems'][0]['branchScope'];
}) {
  const ruLines = formatStaffBranchScopeSummary(scope, 'ru');
  const kkLines = formatStaffBranchScopeSummary(scope, 'kk');

  return (
    <div style={{ marginTop: 6, fontSize: '0.9rem' }}>
      {ruLines.map((line, i) => (
        <div key={`ru-${i}`}>{line}</div>
      ))}
      {kkLines.map((line, i) => (
        <div key={`kk-${i}`} className="muted">
          {line}
        </div>
      ))}
    </div>
  );
}
