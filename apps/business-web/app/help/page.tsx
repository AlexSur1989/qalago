'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BusinessRow, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';

const FAQ = [
  {
    q: 'Как пройти модерацию карточки?',
    a: 'Заполните профиль: название, адрес, описание, часы работы и минимум 3 фото. После отправки статус изменится на «На модерации» — обычно проверка занимает до 24 часов.',
  },
  {
    q: 'Как ответить на отзыв?',
    a: 'Откройте раздел «Отзывы» в меню слева, выберите отзыв и напишите ответ. Он сразу появится в мобильном приложении QalaGo.',
  },
  {
    q: 'Почему не видно акцию в приложении?',
    a: 'Акция должна быть в статусе «Активна» и заведение — опубликовано. Проверьте даты и текст акции в разделе «Акции».',
  },
  {
    q: 'Как добавить услуги или меню?',
    a: 'В разделе «Услуги и меню» создайте группу (например, «Кофе») и добавьте позиции с ценой. Изменения видны пользователям после сохранения.',
  },
  {
    q: 'Как связаться с поддержкой?',
    a: 'Напишите на support@qalago.kz или в WhatsApp +7 777 000 00 00 (MVP — демо-контакт). Укажите название заведения и номер телефона аккаунта.',
  },
];

export default function HelpPage() {
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const business = useSelectedBusiness(businesses);

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then(setBusinesses).catch(() => undefined);
  }, [token]);

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  return (
    <BusinessShell
      activeNav="help"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Помощь</h1>
          <p className="page-header-meta">Частые вопросы и контакты поддержки</p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      <section className="form-card" style={{ maxWidth: 720, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Быстрый старт</h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)' }}>
          <li>Заполните профиль заведения и загрузите фото</li>
          <li>Добавьте меню или услуги</li>
          <li>Создайте первую акцию</li>
          <li>Отслеживайте статистику на главной</li>
        </ol>
      </section>

      <section className="form-card" style={{ maxWidth: 720 }}>
        <h3 style={{ marginTop: 0 }}>FAQ</h3>
        {FAQ.map((item) => (
          <details key={item.q} className="faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <section className="form-card" style={{ maxWidth: 720, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Контакты</h3>
        <p style={{ margin: '0 0 8px' }}>
          Email:{' '}
          <a href="mailto:support@qalago.kz" style={{ color: 'var(--accent)' }}>
            support@qalago.kz
          </a>
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          WhatsApp: +7 777 000 00 00 · пн–пт 10:00–19:00 (UTC+5)
        </p>
      </section>
    </BusinessShell>
  );
}
