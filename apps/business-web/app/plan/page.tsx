'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BusinessRow, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';

const PLANS = [
  {
    id: 'free',
    name: 'Базовый',
    price: '0 ₸',
    period: 'навсегда',
    features: [
      'Карточка заведения в каталоге',
      'До 5 фото',
      'Ответы на отзывы',
      'Базовая статистика просмотров',
    ],
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9 900 ₸',
    period: 'в месяц',
    features: [
      'VIP-метка в выдаче',
      'Неограниченные фото и видео',
      'Приоритетная модерация',
      'Расширенная аналитика',
      'Публикация акций в ленте',
    ],
    current: false,
  },
  {
    id: 'top',
    name: 'Топ города',
    price: '19 900 ₸',
    period: 'в месяц',
    features: [
      'Закрепление в топе категории',
      'Баннер на главной QalaGo',
      'Персональный менеджер',
      'AI-помощник для описаний',
    ],
    current: false,
  },
];

export default function PlanPage() {
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
      activeNav="plan"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Тариф и продвижение</h1>
          <p className="page-header-meta">
            Выберите план для роста видимости {business?.title ?? 'заведения'}
          </p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      <div className="plan-grid">
        {PLANS.map((plan) => (
          <section
            key={plan.id}
            className={`form-card plan-card${plan.current ? ' plan-card-current' : ''}`}
          >
            {plan.current && <span className="plan-badge">Текущий тариф</span>}
            <h2 style={{ margin: '0 0 4px' }}>{plan.name}</h2>
            <p className="plan-price">
              {plan.price}
              <span> / {plan.period}</span>
            </p>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {plan.current ? (
              <button type="button" className="btn btn-ghost" disabled>
                Активен
              </button>
            ) : (
              <button type="button" className="btn" disabled title="Скоро">
                Подключить (скоро)
              </button>
            )}
          </section>
        ))}
      </div>

      <section className="form-card" style={{ marginTop: 16, maxWidth: 720 }}>
        <h3 style={{ marginTop: 0 }}>Нужна помощь с продвижением?</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          Напишите нам — подберём тариф под ваш формат: кафе, салон, сервис или магазин.
        </p>
        <Link href="/help" className="btn btn-ghost">
          Перейти в раздел «Помощь»
        </Link>
      </section>
    </BusinessShell>
  );
}
