'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BusinessRow, PromotionRow, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell } from '@/components/business-shell';

export default function BusinessPromotionsPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [items, setItems] = useState<PromotionRow[]>([]);
  const [title, setTitle] = useState('');
  const [discountText, setDiscountText] = useState('-20%');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const business = businesses.find((b) => b.id === businessId) ?? null;

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then(setBusinesses).catch((err) => setError(String(err)));
  }, [token]);

  async function load(t: string) {
    const res = await ownerApi.listPromotions(t, businessId);
    setItems(res.items);
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err) => setError(String(err)));
  }, [token, businessId]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!token || !title.trim()) return;
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
  }

  async function toggleStatus(p: PromotionRow) {
    if (!token) return;
    const next = p.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
    await ownerApi.updatePromotion(token, p.id, { status: next });
    await load(token);
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

      <form onSubmit={create} className="form-card form-grid" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Новая акция</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
        />
        <input
          value={discountText}
          onChange={(e) => setDiscountText(e.target.value)}
          placeholder="Скидка"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание"
          rows={3}
        />
        <button type="submit" className="btn btn-primary">
          Создать акцию
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
