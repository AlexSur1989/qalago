'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BusinessPlanStatus,
  BusinessRow,
  PromotionRow,
  ownerApi,
} from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell } from '@/components/business-shell';

export default function BusinessPromotionsPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [items, setItems] = useState<PromotionRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [title, setTitle] = useState('');
  const [discountText, setDiscountText] = useState('-20%');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const business = businesses.find((b) => b.id === businessId) ?? null;
  const activeCount = items.filter((p) => p.status === 'ACTIVE').length;
  const atActiveLimit =
    planStatus != null && activeCount >= planStatus.limits.maxActivePromotions;

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then(setBusinesses).catch((err) => setError(String(err)));
  }, [token]);

  async function load(t: string) {
    const [promos, plan] = await Promise.all([
      ownerApi.listPromotions(t, businessId),
      ownerApi.getBusinessPlan(t, businessId),
    ]);
    setItems(promos.items);
    setPlanStatus(plan);
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err) => setError(String(err)));
  }, [token, businessId]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!token || !title.trim()) return;
    setError(null);
    try {
      await ownerApi.createPromotion(token, {
        businessId,
        title: title.trim(),
        discountText,
        description,
        status: 'ACTIVE',
      });
      setTitle('');
      setDescription('');
      await load(token);
    } catch (err) {
      setError(String(err));
    }
  }

  async function toggleStatus(p: PromotionRow) {
    if (!token) return;
    setError(null);
    try {
      const next = p.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
      await ownerApi.updatePromotion(token, p.id, { status: next });
      await load(token);
    } catch (err) {
      setError(String(err));
    }
  }

  async function remove(id: string) {
    if (!token) return;
    await ownerApi.deletePromotion(token, id);
    await load(token);
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  return (
    <BusinessShell
      activeNav="promotions"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Акции</h1>
          <p className="page-header-meta">Управление спецпредложениями для клиентов</p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      {planStatus && (
        <section className="form-card" style={{ maxWidth: 720, marginBottom: 16 }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Тариф «{planStatus.catalog.nameRu}»: активных {activeCount} /{' '}
            {planStatus.limits.maxActivePromotions}
            {planStatus.limits.maxPromotionsInFeed > 0
              ? ` · в ленте города до ${planStatus.limits.maxPromotionsInFeed} одновременно`
              : ' · в ленте города не показываются'}
            {' · '}срок акции до {planStatus.limits.maxPromotionDurationDays} дн.
          </p>
          {atActiveLimit && (
            <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>
              Лимит активных акций достигнут.{' '}
              <Link href="/plan">Улучшить тариф</Link>
            </p>
          )}
        </section>
      )}

      <form onSubmit={create} className="form-card form-grid" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Новая акция</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
          disabled={atActiveLimit}
        />
        <input
          value={discountText}
          onChange={(e) => setDiscountText(e.target.value)}
          placeholder="Скидка"
          disabled={atActiveLimit}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание"
          rows={3}
          disabled={atActiveLimit}
        />
        <button type="submit" className="btn btn-primary" disabled={atActiveLimit}>
          {atActiveLimit ? 'Лимит активных акций' : 'Создать акцию'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Список ({items.length})</h2>
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Пока нет акций</p>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              className="promo-item"
              style={{ alignItems: 'center' }}
            >
              <div className="promo-thumb">🏷️</div>
              <div className="promo-body">
                <strong>{p.title}</strong>
                {p.discountText && (
                  <p style={{ color: 'var(--primary)', margin: '4px 0' }}>{p.discountText}</p>
                )}
                {p.description && <p>{p.description}</p>}
                <span className={`tag ${p.status === 'ACTIVE' ? 'tag-success' : ''}`}>
                  {p.status === 'ACTIVE' ? 'Активна' : p.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-sm" onClick={() => toggleStatus(p)}>
                  {p.status === 'ACTIVE' ? 'Завершить' : 'Активировать'}
                </button>
                <button type="button" className="btn btn-sm" onClick={() => remove(p.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </BusinessShell>
  );
}
