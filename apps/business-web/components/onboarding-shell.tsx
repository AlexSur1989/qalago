'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useAuth } from '@/lib/use-auth';

type OnboardingShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function OnboardingShell({ children, title, subtitle }: OnboardingShellProps) {
  const { user, items, ready, logout } = useAuth();
  const hasBusinesses = items.length > 0;

  if (!ready) {
    return <main className="login-page"><p>Загрузка…</p></main>;
  }

  return (
    <main className="login-page">
      <div className="login-card" style={{ width: 'min(640px, 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            {title && <h1 style={{ margin: '0 0 4px' }}>{title}</h1>}
            {subtitle && <p style={{ margin: 0, color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {hasBusinesses && (
              <Link href="/dashboard" className="btn btn-sm">
                Кабинет
              </Link>
            )}
            <button type="button" className="btn btn-sm btn-ghost" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
        {user?.name && (
          <p className="muted" style={{ marginTop: 0 }}>
            {user.name ?? 'Пользователь'}
            {user.phone ? ` · ${user.phone}` : ''}
          </p>
        )}
        <nav className="monetization-subnav" aria-label="Онбординг" style={{ marginBottom: 20 }}>
          <Link href="/onboarding" className="monetization-subnav-item">
            Старт
          </Link>
          <Link href="/onboarding/search" className="monetization-subnav-item">
            Поиск
          </Link>
          <Link href="/onboarding/apply" className="monetization-subnav-item">
            Новый бизнес
          </Link>
          <Link href="/onboarding/applications" className="monetization-subnav-item">
            Мои заявки
          </Link>
          <Link href="/onboarding/claims" className="monetization-subnav-item">
            Подтверждение
          </Link>
        </nav>
        {children}
      </div>
    </main>
  );
}
