'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminApi,
  aiApi,
  AdminReviewRow,
  AuthUser,
  BusinessRow,
  CategoryRow,
  CityRow,
  EditorialDraft,
  GeoPlaceSuggestion,
  ModerationAnalysis,
} from '@/lib/api';
import { AdminShell } from '@/components/admin-shell';
import { CityNameAutocomplete } from '@/components/city-name-autocomplete';
import {
  AdminTabId,
  confirmAction,
  planTierLabel,
  statusClass,
  statusLabel,
  publicVisibilityClass,
  publicVisibilityLabel,
} from '@/lib/admin-utils';
import { canManageUsers } from '@/lib/rbac';
import { useAuth } from '@/lib/use-auth';

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [citySlug, setCitySlug] = useState('uralsk');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [tab, setTab] = useState<AdminTabId>('moderation');
  const [pending, setPending] = useState<BusinessRow[]>([]);
  const [all, setAll] = useState<BusinessRow[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [catTitle, setCatTitle] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [contentTopic, setContentTopic] = useState('weekend');
  const [contentDraft, setContentDraft] = useState<EditorialDraft | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reviewAnalysis, setReviewAnalysis] = useState<Record<string, ModerationAnalysis>>({});
  const [reviewCheckingId, setReviewCheckingId] = useState<string | null>(null);
  const [businessPage, setBusinessPage] = useState(1);
  const [businessStatusFilter, setBusinessStatusFilter] = useState('');
  const [businessMeta, setBusinessMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [userCityDraft, setUserCityDraft] = useState<Record<string, string>>({});
  const [activeForFeatured, setActiveForFeatured] = useState<BusinessRow[]>([]);
  const [adminCities, setAdminCities] = useState<CityRow[]>([]);
  const [cityNameRu, setCityNameRu] = useState('');
  const [cityNameKk, setCityNameKk] = useState('');
  const [citySlugDraft, setCitySlugDraft] = useState('');
  const [cityLat, setCityLat] = useState('');
  const [cityLng, setCityLng] = useState('');
  const [cityTimezone, setCityTimezone] = useState('Asia/Almaty');
  const [cityActive, setCityActive] = useState(true);
  const [cityLaunchStatus, setCityLaunchStatus] = useState<'COMING_SOON' | 'LIVE'>('COMING_SOON');

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;
  const showUsers = user ? canManageUsers(user.role) : false;

  useEffect(() => {
    adminApi.listCities().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'CITY_ADMIN' && user.managedCity?.slug) {
      setCitySlug(user.managedCity.slug);
    }
  }, [user]);

  useEffect(() => {
    setBusinessPage(1);
  }, [citySlug, businessStatusFilter]);

  async function reloadBusinesses(
    t: string,
    slug: string,
    page = businessPage,
    statusFilter = businessStatusFilter,
  ) {
    const [pendingRes, allRes] = await Promise.all([
      adminApi.listBusinesses(t, slug, 'PENDING', 1, 50),
      adminApi.listBusinesses(t, slug, statusFilter || undefined, page, 20),
    ]);
    setPending(pendingRes.items);
    setAll(allRes.items);
    setBusinessMeta(allRes.meta);
  }

  useEffect(() => {
    if (!token) return;
    reloadBusinesses(token, citySlug).catch((err) => setError(String(err)));
  }, [token, citySlug, businessPage, businessStatusFilter]);

  useEffect(() => {
    if (!token) return;
    adminApi
      .listReviews(token, citySlug)
      .then(setReviews)
      .catch(() => undefined);
  }, [token, citySlug]);

  useEffect(() => {
    if (!token || tab !== 'users' || !showUsers) return;
    adminApi
      .listUsers(token)
      .then(setUsers)
      .catch((err) => setError(String(err)));
  }, [token, showUsers, tab]);

  useEffect(() => {
    if (!token) return;
    adminApi
      .listBusinesses(token, citySlug, 'ACTIVE', 1, 100)
      .then((res) => setActiveForFeatured(res.items))
      .catch(() => undefined);
  }, [token, citySlug]);

  useEffect(() => {
    if (!token || tab !== 'categories') return;
    adminApi
      .listCategoriesAdmin(token, citySlug)
      .then(setCategories)
      .catch((err) => setError(String(err)));
  }, [token, tab, citySlug]);

  async function reloadCityLists(t: string) {
    const [publicCities, allCities] = await Promise.all([
      adminApi.listCities(),
      adminApi.listCitiesAdmin(t),
    ]);
    setCities(publicCities);
    setAdminCities(allCities);
  }

  useEffect(() => {
    if (!token || tab !== 'cities' || !showUsers) return;
    reloadCityLists(token).catch((err) => setError(String(err)));
  }, [token, tab, showUsers]);

  async function setStatus(id: string, status: string, title: string) {
    if (!token) return;
    const msg =
      status === 'BLOCKED'
        ? `Заблокировать «${title}»?`
        : status === 'ACTIVE'
          ? `Активировать «${title}»?`
          : `Изменить статус «${title}» на ${status}?`;
    if (!confirmAction(msg)) return;
    await adminApi.updateStatus(token, id, status);
    await reloadBusinesses(token, citySlug, businessPage, businessStatusFilter);
  }

  async function toggleFeatured(b: BusinessRow) {
    if (!token) return;
    const next = !b.isFeatured;
    const msg = next
      ? `Добавить «${b.title}» в блок «Рекомендуем»?`
      : `Убрать «${b.title}» из Топа?`;
    if (!confirmAction(msg)) return;
    await adminApi.updateFeatured(token, b.id, {
      isFeatured: next,
      featuredSlot: next ? b.featuredSlot ?? 0 : null,
    });
    await reloadBusinesses(token, citySlug, businessPage, businessStatusFilter);
    if (tab === 'featured') {
      const res = await adminApi.listBusinesses(token, citySlug, 'ACTIVE', 1, 100);
      setActiveForFeatured(res.items);
    }
  }

  async function updateFeaturedSlot(b: BusinessRow, slot: number) {
    if (!token || !b.isFeatured) return;
    await adminApi.updateFeatured(token, b.id, {
      isFeatured: true,
      featuredSlot: slot,
    });
    await reloadBusinesses(token, citySlug, businessPage, businessStatusFilter);
    if (tab === 'featured') {
      const res = await adminApi.listBusinesses(token, citySlug, 'ACTIVE', 1, 100);
      setActiveForFeatured(res.items);
    }
  }

  async function setBusinessPlan(b: BusinessRow, tier: string) {
    if (!token || b.planTier === tier) return;
    const label = planTierLabel(tier);
    if (!confirmAction(`Назначить тариф «${label}» для «${b.title}»?`)) return;
    await adminApi.updateBusinessPlan(token, b.id, tier);
    await reloadBusinesses(token, citySlug, businessPage, businessStatusFilter);
    if (tab === 'featured') {
      const res = await adminApi.listBusinesses(token, citySlug, 'ACTIVE', 1, 100);
      setActiveForFeatured(res.items);
    }
  }

  async function changeUserRole(u: AuthUser, role: string) {
    if (!token) return;
    if (role === 'CITY_ADMIN') {
      const cityId = userCityDraft[u.id] ?? u.managedCityId ?? cities[0]?.id;
      if (!cityId) {
        setError('Выберите город для CITY_ADMIN');
        return;
      }
      if (!confirmAction(`Назначить ${u.phone} модератором города?`)) return;
      await adminApi.updateUserRole(token, u.id, role, cityId);
    } else {
      if (!confirmAction(`Сменить роль ${u.phone} на ${role}?`)) return;
      await adminApi.updateUserRole(token, u.id, role, null);
    }
    setUsers(await adminApi.listUsers(token));
  }

  async function changeUserManagedCity(userId: string, managedCityId: string, phone: string) {
    if (!token) return;
    if (!confirmAction(`Сменить город модератора ${phone}?`)) return;
    await adminApi.updateUserRole(token, userId, 'CITY_ADMIN', managedCityId);
    setUsers(await adminApi.listUsers(token));
  }

  async function removeReview(review: AdminReviewRow) {
    if (!token) return;
    const title = review.business?.title ?? 'заведение';
    if (!confirmAction(`Удалить отзыв к «${title}»?`)) return;
    await adminApi.deleteReview(token, review.id);
    setReviews(await adminApi.listReviews(token, citySlug));
    setReviewAnalysis((prev) => {
      const next = { ...prev };
      delete next[review.id];
      return next;
    });
  }

  async function analyzeReview(review: AdminReviewRow) {
    const text = review.text?.trim();
    if (!text) return;
    setReviewCheckingId(review.id);
    setError(null);
    try {
      const result = await aiApi.analyzeModeration({ text, rating: review.rating });
      setReviewAnalysis((prev) => ({ ...prev, [review.id]: result }));
    } catch (err) {
      setError(String(err));
    } finally {
      setReviewCheckingId(null);
    }
  }

  function moderationLabel(action: string) {
    if (action === 'approve') return { text: 'OK', color: 'var(--success)' };
    if (action === 'reject') return { text: 'Риск', color: 'var(--danger)' };
    return { text: 'Проверить', color: 'var(--warning)' };
  }

  async function createCategory(e: FormEvent) {
    e.preventDefault();
    if (!token || !catTitle.trim() || !catSlug.trim()) return;
    await adminApi.createCategory(token, {
      title: catTitle.trim(),
      slug: catSlug.trim().toLowerCase(),
      isActive: true,
    });
    setCatTitle('');
    setCatSlug('');
    setCategories(await adminApi.listCategoriesAdmin(token, citySlug));
  }

  async function toggleCategoryActive(category: CategoryRow) {
    if (!token) return;
    await adminApi.updateCategory(token, category.id, { isActive: !category.isActive });
    setCategories(await adminApi.listCategoriesAdmin(token, citySlug));
  }

  async function removeCategory(category: CategoryRow) {
    if (!token) return;
    if (!confirmAction(`Удалить категорию «${category.title}»?`)) return;
    await adminApi.deleteCategory(token, category.id);
    setCategories(await adminApi.listCategoriesAdmin(token, citySlug));
  }

  async function updateCategoryField(
    category: CategoryRow,
    data: { title?: string; sortOrder?: number },
  ) {
    if (!token) return;
    if (data.sortOrder !== undefined) {
      await adminApi.updateCategoryCityOrder(token, category.id, {
        citySlug,
        sortOrder: data.sortOrder,
      });
    } else {
      await adminApi.updateCategory(token, category.id, data);
    }
    setCategories(await adminApi.listCategoriesAdmin(token, citySlug));
  }

  async function toggleCategoryCityVisibility(category: CategoryRow) {
    if (!token) return;
    const nextHidden = !category.cityIsHidden;
    const msg = nextHidden
      ? `Скрыть «${category.title}» в городе ${cityLabel}?`
      : `Показать «${category.title}» в городе ${cityLabel}?`;
    if (!confirmAction(msg)) return;
    await adminApi.updateCategoryCityVisibility(token, category.id, {
      citySlug,
      isHidden: nextHidden,
    });
    setCategories(await adminApi.listCategoriesAdmin(token, citySlug));
  }

  function applyGeoPlace(place: GeoPlaceSuggestion) {
    setCityNameRu(place.nameRu);
    if (place.nameKk) setCityNameKk(place.nameKk);
    setCitySlugDraft(place.slugSuggestion);
    setCityLat(String(place.lat));
    setCityLng(String(place.lng));
    setCityTimezone(place.timezone);
  }

  async function createCity(e: FormEvent) {
    e.preventDefault();
    if (!token || !cityNameRu.trim() || !citySlugDraft.trim()) return;

    const slug = citySlugDraft.trim().toLowerCase();
    if (adminCities.some((city) => city.slug === slug)) {
      setError(`Город со slug «${slug}» уже существует`);
      return;
    }

    const lat = cityLat.trim() ? Number.parseFloat(cityLat) : undefined;
    const lng = cityLng.trim() ? Number.parseFloat(cityLng) : undefined;
    await adminApi.createCity(token, {
      slug,
      nameRu: cityNameRu.trim(),
      nameKk: cityNameKk.trim() || undefined,
      centerLat: Number.isFinite(lat) ? lat : undefined,
      centerLng: Number.isFinite(lng) ? lng : undefined,
      timezone: cityTimezone,
      isActive: cityActive,
      launchStatus: cityLaunchStatus,
    });
    setCityNameRu('');
    setCityNameKk('');
    setCitySlugDraft('');
    setCityLat('');
    setCityLng('');
    setCityTimezone('Asia/Almaty');
    setCityActive(true);
    setCityLaunchStatus('COMING_SOON');
    await reloadCityLists(token);
  }

  async function setCityLaunchStatusRow(city: CityRow, launchStatus: 'COMING_SOON' | 'LIVE') {
    if (!token || city.launchStatus === launchStatus) return;
    await adminApi.updateCity(token, city.id, { launchStatus });
    await reloadCityLists(token);
  }

  async function toggleCityActive(city: CityRow) {
    if (!token) return;
    const next = !city.isActive;
    const msg = next
      ? `Активировать город «${city.nameRu}»? Он появится в приложении.`
      : `Скрыть город «${city.nameRu}»? Пользователи не смогут его выбрать.`;
    if (!confirmAction(msg)) return;
    await adminApi.updateCity(token, city.id, { isActive: next });
    await reloadCityLists(token);
  }

  async function generateDraft() {
    setContentLoading(true);
    setContentError(null);
    setCopied(false);
    try {
      const draft = await aiApi.createContentDraft({
        citySlug,
        topic: contentTopic,
        limit: 5,
      });
      setContentDraft(draft);
    } catch (err) {
      setContentError(String(err));
      setContentDraft(null);
    } finally {
      setContentLoading(false);
    }
  }

  async function copyDraft() {
    if (!contentDraft) return;
    const text = `# ${contentDraft.title}\n\n${contentDraft.bodyMarkdown}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeBusinesses = useMemo(
    () => (tab === 'featured' ? activeForFeatured : all.filter((b) => b.status === 'ACTIVE')),
    [tab, activeForFeatured, all],
  );
  const featuredBusinesses = useMemo(
    () =>
      [...activeForFeatured.filter((b) => b.isFeatured)].sort(
        (a, b) => (a.featuredSlot ?? 999) - (b.featuredSlot ?? 999),
      ),
    [activeForFeatured],
  );

  const cityLabel =
    user?.managedCity?.nameRu ??
    cities.find((c) => c.slug === citySlug)?.nameRu ??
    citySlug;

  const businessPageCount = Math.max(1, Math.ceil(businessMeta.total / businessMeta.limit));

  if (!ready || !token || !user) {
    return <p className="page-content">Загрузка…</p>;
  }

  return (
    <AdminShell
      activeTab={tab}
      onTabChange={(nextTab) => {
        if (nextTab === 'monetization') {
          router.push('/monetization');
          return;
        }
        setTab(nextTab);
      }}
      user={user}
      citySlug={citySlug}
      cities={cities.length > 0 ? cities : [{ slug: citySlug, nameRu: cityLabel }]}
      cityLocked={cityLocked}
      onCityChange={setCitySlug}
      badges={{
        pending: pending.length,
        featured: featuredBusinesses.length,
        reviews: reviews.length,
      }}
      onLogout={logout}
    >
      {error && <div className="alert alert-error">{error}</div>}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">На модерации</div>
          <div className="kpi-value">{pending.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Активных</div>
          <div className="kpi-value">{activeBusinesses.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">В Топе</div>
          <div className="kpi-value">{featuredBusinesses.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Отзывов</div>
          <div className="kpi-value">{reviews.length}</div>
        </div>
      </div>

      {tab === 'moderation' && (
        <>
          <section className="card">
            <h2>Ожидают модерации ({pending.length})</h2>
            {pending.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Нет заявок</p>
            ) : (
              pending.map((b) => (
                <div key={b.id} className="moderation-card">
                  {b.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverImageUrl} alt="" className="moderation-thumb" />
                  ) : (
                    <div className="moderation-thumb placeholder">
                      {b.title.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="moderation-body">
                    <strong>{b.title}</strong>
                    <div className="moderation-meta">
                      {b.category?.title ?? 'Категория'} · {b.address}
                    </div>
                    {b.shortDesc && (
                      <div className="moderation-meta">{b.shortDesc}</div>
                    )}
                    <div className="moderation-meta">
                      Владелец: {b.owner?.phone}
                      {b.phone ? ` · ${b.phone}` : ''}
                    </div>
                    <div className="moderation-meta">
                      <span className={publicVisibilityClass(b.status)}>
                        {publicVisibilityLabel(b.status)}
                      </span>
                    </div>
                  </div>
                  <div className="moderation-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setStatus(b.id, 'ACTIVE', b.title)}
                    >
                      Одобрить
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setStatus(b.id, 'BLOCKED', b.title)}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="card">
            <div className="table-toolbar">
              <h2>Все заведения ({businessMeta.total})</h2>
              <select
                value={businessStatusFilter}
                onChange={(e) => setBusinessStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Все статусы</option>
                <option value="ACTIVE">Активные</option>
                <option value="PENDING">На модерации</option>
                <option value="BLOCKED">Заблокированные</option>
              </select>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Статус</th>
                  <th>Приложение</th>
                  <th>Тариф</th>
                  <th>Город</th>
                  <th>VIP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {all.map((b) => (
                  <tr key={b.id}>
                    <td>{b.title}</td>
                    <td>{b.category?.title ?? '—'}</td>
                    <td>
                      <span className={statusClass(b.status)}>{statusLabel(b.status)}</span>
                    </td>
                    <td>
                      <span className={publicVisibilityClass(b.status)}>
                        {publicVisibilityLabel(b.status)}
                      </span>
                    </td>
                    <td>
                      <select
                        className="filter-select"
                        value={b.planTier ?? 'BASIC'}
                        onChange={(e) => setBusinessPlan(b, e.target.value)}
                        title={
                          b.planExpiresAt
                            ? `До ${new Date(b.planExpiresAt).toLocaleDateString('ru-RU')}`
                            : undefined
                        }
                      >
                        <option value="BASIC">Базовый</option>
                        <option value="PRO">Pro</option>
                        <option value="TOP_CITY">Топ города</option>
                      </select>
                    </td>
                    <td>{b.city?.nameRu}</td>
                    <td>
                      {b.isFeatured ? (
                        <span className="tag tag-success">Топ</span>
                      ) : (
                        <span className="tag tag-muted">—</span>
                      )}
                    </td>
                    <td>
                      {b.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setStatus(b.id, 'BLOCKED', b.title)}
                        >
                          Блок
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setStatus(b.id, 'ACTIVE', b.title)}
                        >
                          Активировать
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {businessPageCount > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={businessPage <= 1}
                  onClick={() => setBusinessPage((p) => p - 1)}
                >
                  ← Назад
                </button>
                <span className="pagination-meta">
                  Стр. {businessPage} из {businessPageCount}
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={businessPage >= businessPageCount}
                  onClick={() => setBusinessPage((p) => p + 1)}
                >
                  Вперёд →
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'featured' && (
        <section className="card">
          <h2>VIP / Топ — активные заведения ({activeBusinesses.length})</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
            Меньший номер слота — выше в блоке «Рекомендуем» в приложении.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Адрес</th>
                <th>Слот</th>
                <th>Статус VIP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeBusinesses.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td>{b.address}</td>
                  <td>
                    {b.isFeatured ? (
                      <input
                        type="number"
                        min={0}
                        max={99}
                        className="slot-input"
                        defaultValue={b.featuredSlot ?? 0}
                        onBlur={(e) =>
                          updateFeaturedSlot(b, Number.parseInt(e.target.value, 10) || 0)
                        }
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {b.isFeatured ? (
                      <span className="tag tag-success">В Топе</span>
                    ) : (
                      <span className="tag tag-muted">Обычное</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`btn btn-sm${b.isFeatured ? '' : ' btn-primary'}`}
                      onClick={() => toggleFeatured(b)}
                    >
                      {b.isFeatured ? 'Убрать из Топа' : 'Добавить в Топ'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'reviews' && (
        <section className="card">
          <h2>Отзывы · {cityLabel} ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Нет отзывов</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Заведение</th>
                  <th>Оценка</th>
                  <th>Текст</th>
                  <th>AI</th>
                  <th>Автор</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td>{r.business?.title ?? '—'}</td>
                    <td>{r.rating}★</td>
                    <td style={{ maxWidth: 280 }}>{r.text ?? '—'}</td>
                    <td>
                      {r.text?.trim() ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 100 }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            disabled={reviewCheckingId === r.id}
                            onClick={() => analyzeReview(r)}
                          >
                            {reviewCheckingId === r.id ? '…' : 'AI'}
                          </button>
                          {reviewAnalysis[r.id] && (() => {
                            const m = moderationLabel(reviewAnalysis[r.id].suggestedAction);
                            return (
                              <span
                                style={{ fontSize: 12, fontWeight: 600, color: m.color }}
                                title={
                                  reviewAnalysis[r.id].flags[0]?.message ??
                                  `Score ${reviewAnalysis[r.id].score}`
                                }
                              >
                                {m.text} · {reviewAnalysis[r.id].score}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{r.user?.phone ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeReview(r)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'categories' && (
        <>
          <section className="card">
            <h2>Новая категория</h2>
            <form onSubmit={createCategory} className="form-grid" style={{ maxWidth: 480 }}>
              <input
                value={catTitle}
                onChange={(e) => setCatTitle(e.target.value)}
                placeholder="Название, например Рестораны"
              />
              <input
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="slug, например food"
              />
              <button type="submit" className="btn btn-primary">
                Добавить
              </button>
            </form>
          </section>
          <section className="card">
            <h2>Категории каталога ({categories.length})</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
              Порядок и видимость для города <strong>{cityLabel}</strong>. Скрытые категории не
              показываются в приложении.
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Slug</th>
                  <th>Порядок ({cityLabel})</th>
                  <th>Глобальный</th>
                  <th>В городе</th>
                  <th>Глоб. статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} style={c.cityIsHidden ? { opacity: 0.65 } : undefined}>
                    <td>
                      <input
                        className="slot-input table-input"
                        defaultValue={c.title}
                        onBlur={(e) => {
                          const next = e.target.value.trim();
                          if (next && next !== c.title) {
                            updateCategoryField(c, { title: next });
                          }
                        }}
                      />
                    </td>
                    <td>{c.slug}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="slot-input"
                        defaultValue={c.citySortOrder ?? c.sortOrder}
                        key={`${c.id}-${citySlug}-${c.citySortOrder ?? c.sortOrder}`}
                        onBlur={(e) => {
                          const next = Number.parseInt(e.target.value, 10) || 0;
                          const current = c.citySortOrder ?? c.sortOrder;
                          if (next !== current) {
                            updateCategoryField(c, { sortOrder: next });
                          }
                        }}
                      />
                    </td>
                    <td>{c.sortOrder}</td>
                    <td>
                      {c.cityIsHidden ? (
                        <span className="tag tag-muted">Скрыта</span>
                      ) : (
                        <span className="tag tag-success">Видна</span>
                      )}
                    </td>
                    <td>
                      {c.isActive ? (
                        <span className="tag tag-success">Активна</span>
                      ) : (
                        <span className="tag tag-muted">Скрыта</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => toggleCategoryCityVisibility(c)}
                      >
                        {c.cityIsHidden ? 'Показать' : 'Скрыть'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => toggleCategoryActive(c)}
                      >
                        {c.isActive ? 'Скрыть' : 'Показать'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeCategory(c)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === 'content' && (
        <section className="card">
          <h2>Контент · черновик подборки</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
            AI сгенерирует markdown для города <strong>{cityLabel}</strong>.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              Тема:
              <select value={contentTopic} onChange={(e) => setContentTopic(e.target.value)}>
                <option value="weekend">На выходных</option>
                <option value="food">Еда</option>
                <option value="bars">Бары</option>
                <option value="beauty">Красота</option>
                <option value="fitness">Фитнес</option>
                <option value="fun">Развлечения</option>
              </select>
            </label>
            <button type="button" className="btn btn-primary" onClick={generateDraft} disabled={contentLoading}>
              {contentLoading ? 'Генерация…' : 'Сгенерировать'}
            </button>
            {contentDraft && (
              <button type="button" className="btn" onClick={copyDraft}>
                {copied ? 'Скопировано' : 'Копировать markdown'}
              </button>
            )}
          </div>
          {contentError && <div className="alert alert-error">{contentError}</div>}
          {contentDraft && (
            <>
              <h3>{contentDraft.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Заведений: {contentDraft.businessIds.length} · {contentDraft.source}
              </p>
              <textarea readOnly value={contentDraft.bodyMarkdown} rows={14} className="markdown-box" />
            </>
          )}
        </section>
      )}

      {tab === 'users' && showUsers && (
        <section className="card">
          <h2>Пользователи ({users.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Телефон</th>
                <th>Имя</th>
                <th>Роль</th>
                <th>Город (CITY_ADMIN)</th>
                <th>Новая роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.phone}</td>
                  <td>{u.name ?? '—'}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.role === 'CITY_ADMIN' ? (
                      <select
                        value={u.managedCityId ?? ''}
                        onChange={(e) =>
                          changeUserManagedCity(u.id, e.target.value, u.phone)
                        }
                      >
                        <option value="">—</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.nameRu}
                          </option>
                        ))}
                      </select>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <select
                        value={u.role}
                        onChange={(e) => changeUserRole(u, e.target.value)}
                      >
                        <option value="USER">USER</option>
                        <option value="BUSINESS">BUSINESS</option>
                        <option value="CITY_ADMIN">CITY_ADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      {u.role !== 'CITY_ADMIN' && (
                        <select
                          value={userCityDraft[u.id] ?? cities[0]?.id ?? ''}
                          onChange={(e) =>
                            setUserCityDraft((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                          title="Город при назначении CITY_ADMIN"
                        >
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.nameRu}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'cities' && showUsers && (
        <>
          <section className="card">
            <h2>Новый город</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
              Начните вводить название — подсказки появятся автоматически. При выборе заполнятся
              slug, широта, долгота и timezone.
            </p>
            <form onSubmit={createCity} className="form-grid" style={{ maxWidth: 640 }}>
              {token && (
                <CityNameAutocomplete
                  token={token}
                  value={cityNameRu}
                  onChange={setCityNameRu}
                  onSelect={applyGeoPlace}
                  placeholder="Начните вводить: Астана, Шымкент…"
                  required
                />
              )}
              <input
                value={cityNameKk}
                onChange={(e) => setCityNameKk(e.target.value)}
                placeholder="Название (KK), опционально"
              />
              <input
                value={citySlugDraft}
                onChange={(e) => setCitySlugDraft(e.target.value.toLowerCase())}
                placeholder="slug, например astana"
                pattern="[a-z0-9-]+"
                required
              />
              <input
                value={cityLat}
                onChange={(e) => setCityLat(e.target.value)}
                placeholder="Широта центра, например 51.1694"
              />
              <input
                value={cityLng}
                onChange={(e) => setCityLng(e.target.value)}
                placeholder="Долгота центра, например 71.4491"
              />
              <select value={cityTimezone} onChange={(e) => setCityTimezone(e.target.value)}>
                <option value="Asia/Almaty">Asia/Almaty</option>
                <option value="Asia/Aqtobe">Asia/Aqtobe</option>
                <option value="Asia/Oral">Asia/Oral</option>
                <option value="Asia/Qyzylorda">Asia/Qyzylorda</option>
                <option value="Asia/Aqtau">Asia/Aqtau</option>
              </select>
              <select
                value={cityLaunchStatus}
                onChange={(e) =>
                  setCityLaunchStatus(e.target.value as 'COMING_SOON' | 'LIVE')
                }
              >
                <option value="COMING_SOON">Скоро откроется</option>
                <option value="LIVE">Запущен</option>
              </select>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={cityActive}
                  onChange={(e) => setCityActive(e.target.checked)}
                />
                Активен сразу после создания
              </label>
              <button type="submit" className="btn btn-primary">
                Добавить город
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Города платформы ({adminCities.length})</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>KK</th>
                  <th>Slug</th>
                  <th>Центр</th>
                  <th>Timezone</th>
                  <th>Запуск</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {adminCities.map((city) => (
                  <tr key={city.id}>
                    <td>{city.nameRu}</td>
                    <td>{city.nameKk ?? '—'}</td>
                    <td>{city.slug}</td>
                    <td>
                      {city.centerLat != null && city.centerLng != null
                        ? `${city.centerLat}, ${city.centerLng}`
                        : '—'}
                    </td>
                    <td>{city.timezone ?? '—'}</td>
                    <td>
                      <select
                        className="filter-select"
                        value={city.launchStatus ?? 'LIVE'}
                        onChange={(e) =>
                          setCityLaunchStatusRow(
                            city,
                            e.target.value as 'COMING_SOON' | 'LIVE',
                          )
                        }
                      >
                        <option value="COMING_SOON">Скоро</option>
                        <option value="LIVE">Live</option>
                      </select>
                    </td>
                    <td>
                      {city.isActive ? (
                        <span className="tag tag-success">Активен</span>
                      ) : (
                        <span className="tag tag-muted">Скрыт</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => toggleCityActive(city)}
                      >
                        {city.isActive ? 'Скрыть' : 'Активировать'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </AdminShell>
  );
}
