'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PromotionRow, ownerApi, TOKEN_KEY } from '@/lib/api';

export default function BusinessPromotionsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const businessId = params.id;
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<PromotionRow[]>([]);
  const [title, setTitle] = useState('');
  const [discountText, setDiscountText] = useState('-20%');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
  }, [router]);

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

  if (!token) return <p style={{ padding: 24 }}>Загрузка…</p>;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <p>
        <Link href="/dashboard">← Кабинет</Link>
      </p>
      <h1>Акции</h1>

      <form
        onSubmit={create}
        style={{ display: 'grid', gap: 10, background: '#fff', padding: 16, borderRadius: 12, marginBottom: 24 }}
      >
        <h2 style={{ margin: 0 }}>Новая акция</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <input
          value={discountText}
          onChange={(e) => setDiscountText(e.target.value)}
          placeholder="Скидка"
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание"
          rows={3}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: 10, borderRadius: 8 }}>Создать</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <section style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
        <h2>Список ({items.length})</h2>
        {items.length === 0 ? (
          <p>Пока нет акций</p>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              style={{ borderTop: '1px solid #eee', padding: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 12 }}
            >
              <div>
                <strong>{p.title}</strong>
                {p.discountText && <div style={{ color: '#1e6bd6' }}>{p.discountText}</div>}
                {p.description && <div style={{ fontSize: 14, color: '#666' }}>{p.description}</div>}
                <div style={{ fontSize: 13 }}>Статус: {p.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => toggleStatus(p)}>
                  {p.status === 'ACTIVE' ? 'Завершить' : 'Активировать'}
                </button>
                <button onClick={() => remove(p.id)}>Удалить</button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
