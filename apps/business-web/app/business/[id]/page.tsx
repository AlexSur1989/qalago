'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BusinessRow, ownerApi, TOKEN_KEY } from '@/lib/api';

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
  const router = useRouter();
  const id = params.id;
  const [token, setToken] = useState<string | null>(null);
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

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      router.replace('/login');
      return;
    }
    setToken(t);
  }, [router]);

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
    } catch (err) {
      setError(String(err));
    }
  }

  if (!token) return <p style={{ padding: 24 }}>Загрузка…</p>;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <p>
        <Link href="/dashboard">← Кабинет</Link>
      </p>
      <h1>Профиль заведения</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, background: '#fff', padding: 16, borderRadius: 12 }}>
        {field('Название', form.title, (v) => setForm({ ...form, title: v }))}
        {field('Краткое описание', form.shortDesc, (v) => setForm({ ...form, shortDesc: v }))}
        {area('Описание', form.description, (v) => setForm({ ...form, description: v }))}
        {field('Адрес', form.address, (v) => setForm({ ...form, address: v }))}
        {field('Телефон', form.phone, (v) => setForm({ ...form, phone: v }))}
        {field('WhatsApp', form.whatsapp, (v) => setForm({ ...form, whatsapp: v }))}
        {field('Instagram', form.instagram, (v) => setForm({ ...form, instagram: v }))}
        {field('Сайт', form.website, (v) => setForm({ ...form, website: v }))}
        <h3>График работы</h3>
        {field('Пн–Пт', form.weekdays, (v) => setForm({ ...form, weekdays: v }))}
        {field('Суббота', form.saturday, (v) => setForm({ ...form, saturday: v }))}
        {field('Воскресенье', form.sunday, (v) => setForm({ ...form, sunday: v }))}
        <button type="submit" style={{ padding: 10, borderRadius: 8 }}>Сохранить</button>
        {saved && <p style={{ color: 'green' }}>Сохранено</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
    </main>
  );
}

function field(label: string, value: string, onChange: (v: string) => void) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
      />
    </label>
  );
}

function area(label: string, value: string, onChange: (v: string) => void) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
      />
    </label>
  );
}
