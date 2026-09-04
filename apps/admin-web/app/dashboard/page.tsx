'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, aiApi, AdminReviewRow, AuthUser, BusinessRow, CategoryRow, EditorialDraft, ModerationAnalysis, TOKEN_KEY } from '@/lib/api';
import { canManageUsers, getRoleDefinition } from '@/lib/rbac';

type TabId = 'moderation' | 'featured' | 'reviews' | 'categories' | 'users' | 'content';

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [citySlug, setCitySlug] = useState('uralsk');
  const [tab, setTab] = useState<TabId>('moderation');
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

  const isCityAdmin = user?.role === 'CITY_ADMIN';
  const cityLocked = isCityAdmin && !!user?.managedCity?.slug;
  const showUsers = user ? canManageUsers(user.role) : false;

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

  async function reloadBusinesses(t: string, slug: string) {
    const [pendingRes, allRes] = await Promise.all([
      adminApi.listBusinesses(t, slug, 'PENDING'),
      adminApi.listBusinesses(t, slug),
    ]);
    setPending(pendingRes.items);
    setAll(allRes.items);
  }

  useEffect(() => {
    if (!token) return;
    reloadBusinesses(token, citySlug).catch((err) => setError(String(err)));
  }, [token, citySlug]);

  useEffect(() => {
    if (!token || tab !== 'users' || !showUsers) return;
    adminApi
      .listUsers(token)
      .then(setUsers)
      .catch((err) => setError(String(err)));
  }, [token, showUsers, tab]);

  useEffect(() => {
    if (!token || tab !== 'reviews') return;
    adminApi
      .listReviews(token, citySlug)
      .then(setReviews)
      .catch((err) => setError(String(err)));
  }, [token, citySlug, tab]);

  useEffect(() => {
    if (tab !== 'categories') return;
    adminApi
      .listCategories()
      .then(setCategories)
      .catch((err) => setError(String(err)));
  }, [tab]);

  async function setStatus(id: string, status: string) {
    if (!token) return;
    await adminApi.updateStatus(token, id, status);
    await reloadBusinesses(token, citySlug);
  }

  async function toggleFeatured(id: string, current: boolean) {
    if (!token) return;
    await adminApi.updateFeatured(token, id, !current);
    await reloadBusinesses(token, citySlug);
  }

  async function changeUserRole(userId: string, role: string) {
    if (!token) return;
    await adminApi.updateUserRole(token, userId, role);
    setUsers(await adminApi.listUsers(token));
  }

  async function removeReview(reviewId: string) {
    if (!token) return;
    await adminApi.deleteReview(token, reviewId);
    setReviews(await adminApi.listReviews(token, citySlug));
    setReviewAnalysis((prev) => {
      const next = { ...prev };
      delete next[reviewId];
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
    if (action === 'approve') return { text: 'OK', color: '#1b7f4a' };
    if (action === 'reject') return { text: 'Риск', color: '#c0392b' };
    return { text: 'Проверить', color: '#b7791f' };
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
    setCategories(await adminApi.listCategories());
  }

  async function toggleCategoryActive(category: CategoryRow) {
    if (!token) return;
    await adminApi.updateCategory(token, category.id, { isActive: !category.isActive });
    setCategories(await adminApi.listCategories());
  }

  async function removeCategory(id: string) {
    if (!token) return;
    await adminApi.deleteCategory(token, id);
    setCategories(await adminApi.listCategories());
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

  if (!token) return <p className="page">Загрузка…</p>;

  const cityLabel =
    user?.managedCity?.nameRu ?? (citySlug === 'aktobe' ? 'Актобе' : 'Уральск');
  const roleInfo = user ? getRoleDefinition(user.role) : null;
  const activeBusinesses = all.filter((b) => b.status === 'ACTIVE');
  const featuredBusinesses = all.filter((b) => b.isFeatured);

  return (
    <main className="page">
      <header className="page-header">
        <h1>
          Admin · QalaGo
          {isCityAdmin ? ` · ${cityLabel}` : ''}
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {cityLocked ? (
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Город: {cityLabel}
            </span>
          ) : (
            <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)}>
              <option value="uralsk">Уральск</option>
              <option value="aktobe">Актобе</option>
            </select>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              router.push('/login');
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {roleInfo && (
        <section className="card card-muted">
          <h2>Роль: {roleInfo.labelRu}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>{roleInfo.summaryRu}</p>
        </section>
      )}

      <nav className="tabs">
        <button
          type="button"
          className={`tab${tab === 'moderation' ? ' active' : ''}`}
          onClick={() => setTab('moderation')}
        >
          Модерация ({pending.length})
        </button>
        <button
          type="button"
          className={`tab${tab === 'featured' ? ' active' : ''}`}
          onClick={() => setTab('featured')}
        >
          VIP / Топ ({featuredBusinesses.length})
        </button>
        <button
          type="button"
          className={`tab${tab === 'reviews' ? ' active' : ''}`}
          onClick={() => setTab('reviews')}
        >
          Отзывы ({reviews.length || '…'})
        </button>
        <button
          type="button"
          className={`tab${tab === 'categories' ? ' active' : ''}`}
          onClick={() => setTab('categories')}
        >
          Категории
        </button>
        <button
          type="button"
          className={`tab${tab === 'content' ? ' active' : ''}`}
          onClick={() => setTab('content')}
        >
          AI-черновики
        </button>
        {showUsers && (
          <button
            type="button"
            className={`tab${tab === 'users' ? ' active' : ''}`}
            onClick={() => setTab('users')}
          >
            Пользователи
          </button>
        )}
      </nav>

      {tab === 'moderation' && (
        <>
          <section className="card">
            <h2>Ожидают модерации ({pending.length})</h2>
            {pending.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Нет заявок</p>
            ) : (
              pending.map((b) => (
                <div
                  key={b.id}
                  style={{
                    borderTop: '1px solid var(--border)',
                    padding: '12px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong>{b.title}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      {b.address}
                    </div>
                    <div style={{ fontSize: 13 }}>Владелец: {b.owner?.phone}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setStatus(b.id, 'ACTIVE')}
                    >
                      Одобрить
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setStatus(b.id, 'BLOCKED')}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="card">
            <h2>Все заведения ({all.length})</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Статус</th>
                  <th>Город</th>
                  <th>VIP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {all.map((b) => (
                  <tr key={b.id}>
                    <td>{b.title}</td>
                    <td>{b.status}</td>
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
                          onClick={() => setStatus(b.id, 'BLOCKED')}
                        >
                          Блок
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setStatus(b.id, 'ACTIVE')}
                        >
                          Активировать
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === 'featured' && (
        <section className="card">
          <h2>VIP / Топ — активные заведения ({activeBusinesses.length})</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
            Заведения с меткой «Топ» показываются в блоке «Рекомендуем» в приложении.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Адрес</th>
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
                      <span className="tag tag-success">В Топе</span>
                    ) : (
                      <span className="tag tag-muted">Обычное</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`btn btn-sm${b.isFeatured ? '' : ' btn-primary'}`}
                      onClick={() => toggleFeatured(b.id, b.isFeatured)}
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
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
            Модерация отзывов в рамках выбранного города.
          </p>
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
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: m.color,
                                }}
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
                        onClick={() => removeReview(r.id)}
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
              <button type="submit" className="btn btn-primary" disabled={!token}>
                Добавить
              </button>
            </form>
          </section>
          <section className="card">
            <h2>Категории каталога ({categories.length})</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Slug</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{c.slug}</td>
                    <td>
                      {c.isActive ? (
                        <span className="tag tag-success">Активна</span>
                      ) : (
                        <span className="tag tag-muted">Скрыта</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
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
                        onClick={() => removeCategory(c.id)}
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
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
            Только ADMIN может менять роли.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Телефон</th>
                <th>Имя</th>
                <th>Роль</th>
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
                    <select
                      value={u.role}
                      onChange={(e) => changeUserRole(u.id, e.target.value)}
                    >
                      <option value="USER">USER</option>
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="CITY_ADMIN">CITY_ADMIN</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
