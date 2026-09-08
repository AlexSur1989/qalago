'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BusinessRow, myBusinessRows, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';

const FAQ = [
  {
    q: 'Как пройти модерацию карточки?',
    a: 'Заполните профиль: название, адрес, описание, часы работы и минимум 3 фото. После отправки статус изменится на «На модерации» — обычно проверка занимает до 24 часов.',
  },
  {
    q: 'Как ответить на отзыв?',
    a: 'Откройте «Мой бизнес» → «Отзывы» или быстрые ссылки на обзоре, выберите отзыв и напишите ответ.',
  },
  {
    q: 'Как добавить товары или услуги?',
    a: 'В разделе «Товары и услуги» создайте группу (например, «Кофе») и добавьте позиции с ценой.',
  },
  {
    q: 'Почему не видно акцию в приложении?',
    a: 'Акция должна быть «Активна», заведение — опубликовано. На Free/Basic число одновременно активных акций ограничено тарифом — лишние сохраняются в кабинете, но не публикуются.',
  },
  {
    q: 'Чем отличаются тарифы Free, Basic, Premium и VIP?',
    a: 'Free — базовые лимиты и 7 дней статистики. Basic и Premium — больше фото, товаров, акций и расширенная аналитика. VIP — максимальные лимиты и приоритет модерации. Рекламные размещения покупаются отдельно в разделе «Реклама и продвижение».',
  },
  {
    q: 'Что будет когда тариф закончится?',
    a: 'Заведение вернётся на Free: лишние фото, товары и акции останутся в кабинете, но перестанут публиковаться сверх лимита. Уведомление придёт во «Входящие».',
  },
  {
    q: 'Как оплатить рекламу?',
    a: 'После оформления заказа переведите сумму по реквизитам из этого раздела. Оплата подтверждается администратором вручную — автоматического списания нет.',
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
    ownerApi.listMyBusinesses(token).then((res) => setBusinesses(myBusinessRows(res.items))).catch(() => undefined);
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
