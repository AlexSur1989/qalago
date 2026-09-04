'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CategoryRow,
  SELECTED_BUSINESS_KEY,
  ownerApi,
} from '@/lib/api';
import { useAuth } from '@/lib/use-auth';

export default function RegisterPage() {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    ownerApi
      .listCategories()
      .then((items) => {
        setCategories(items);
        if (items.length > 0) setCategoryId(items[0].id);
      })
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user?.phone, phone]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!title.trim() || !categoryId || !address.trim()) {
      setError('Заполните название, категорию и адрес');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const business = await ownerApi.createBusiness(token, {
        title: title.trim(),
        categoryId,
        citySlug: 'uralsk',
        address: address.trim(),
        phone: phone.trim() || undefined,
        shortDesc: shortDesc.trim() || undefined,
      });
      localStorage.setItem(SELECTED_BUSINESS_KEY, business.id);
      setSuccess('Заявка отправлена на модерацию. Заполните профиль, пока идёт проверка.');
      setTimeout(() => router.push(`/business/${business.id}`), 1200);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  return (
    <main className="login-page">
      <div className="login-card" style={{ width: 'min(520px, 100%)' }}>
        <h1>Регистрация заведения</h1>
        <p>
          Заполните данные — после проверки модератором заведение появится в QalaGo.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={submit} className="form-grid">
          <label>
            Название заведения *
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Coffee Boom"
              required
            />
          </label>

          <label>
            Категория *
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Адрес *
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ул. Евразийская, 10"
              required
            />
          </label>

          <label>
            Телефон для клиентов
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+77000000000"
            />
          </label>

          <label>
            Краткое описание
            <textarea
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              rows={3}
              placeholder="Кофейня с завтраками и десертами"
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Отправка…' : 'Отправить заявку'}
          </button>
        </form>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Link href="/dashboard" className="btn">
            ← В кабинет
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>
    </main>
  );
}
