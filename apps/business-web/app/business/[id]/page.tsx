'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BusinessRow, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell } from '@/components/business-shell';

function parseHours(raw: BusinessRow['workHours']) {
  const weekdays = raw?.mon ?? raw?.tue ?? '09:00-22:00';
  return {
    weekdays,
    saturday: raw?.sat ?? weekdays,
    sunday: raw?.sun ?? weekdays,
  };
}

export default function BusinessEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [form, setForm] = useState({
    title: '',
    shortDesc: '',
    description: '',
    address: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    website: '',
    weekdays: '09:00-22:00',
    saturday: '09:00-22:00',
    sunday: '09:00-22:00',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const business = businesses.find((b) => b.id === id) ?? null;

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then(setBusinesses).catch((err) => setError(String(err)));
  }, [token]);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      try {
        const b = await ownerApi.getBusiness(token, id);
        const hours = parseHours(b.workHours);
        setForm({
          title: b.title ?? '',
          shortDesc: b.shortDesc ?? '',
          description: b.description ?? '',
          address: b.address ?? '',
          phone: b.phone ?? '',
          whatsapp: b.whatsapp ?? '',
          instagram: b.instagram ?? '',
          website: b.website ?? '',
          ...hours,
        });
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [token, id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSaved(false);
    try {
      await ownerApi.updateBusiness(token, id, {
        title: form.title,
        shortDesc: form.shortDesc,
        description: form.description,
        address: form.address,
        phone: form.phone,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        website: form.website,
        workHours: {
          mon: form.weekdays,
          tue: form.weekdays,
          wed: form.weekdays,
          thu: form.weekdays,
          fri: form.weekdays,
          sat: form.saturday,
          sun: form.sunday,
        },
      });
      setSaved(true);
      const items = await ownerApi.listMyBusinesses(token);
      setBusinesses(items);
    } catch (err) {
      setError(String(err));
    }
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  return (
    <BusinessShell
      activeNav="profile"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Профиль заведения</h1>
          <p className="page-header-meta">Редактирование карточки в каталоге QalaGo</p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      <form onSubmit={onSubmit} className="form-card form-grid" style={{ maxWidth: 720 }}>
        {field('Название', form.title, (v) => setForm({ ...form, title: v }))}
        {field('Краткое описание', form.shortDesc, (v) => setForm({ ...form, shortDesc: v }))}
        {area('Описание', form.description, (v) => setForm({ ...form, description: v }))}
        {field('Адрес', form.address, (v) => setForm({ ...form, address: v }))}
        {field('Телефон', form.phone, (v) => setForm({ ...form, phone: v }))}
        {field('WhatsApp', form.whatsapp, (v) => setForm({ ...form, whatsapp: v }))}
        {field('Instagram', form.instagram, (v) => setForm({ ...form, instagram: v }))}
        {field('Сайт', form.website, (v) => setForm({ ...form, website: v }))}
        <h3 className="form-section-title">График работы</h3>
        {field('Пн–Пт', form.weekdays, (v) => setForm({ ...form, weekdays: v }))}
        {field('Суббота', form.saturday, (v) => setForm({ ...form, saturday: v }))}
        {field('Воскресенье', form.sunday, (v) => setForm({ ...form, sunday: v }))}
        <button type="submit" className="btn btn-primary">
          Сохранить
        </button>
        {saved && <div className="alert alert-success">Сохранено</div>}
        {error && <div className="alert alert-error">{error}</div>}
      </form>
    </BusinessShell>
  );
}

function field(label: string, value: string, onChange: (v: string) => void) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function area(label: string, value: string, onChange: (v: string) => void) {
  return (
    <label>
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} />
    </label>
  );
}
