'use client';

import Link from 'next/link';
import { OnboardingShell } from '@/components/onboarding-shell';
import { useAuth } from '@/lib/use-auth';
import { membershipRoleLabel } from '@/lib/onboarding-utils';

export default function OnboardingStartPage() {
  const { items } = useAuth();

  return (
    <OnboardingShell
      title="Добавьте или найдите свой бизнес"
      subtitle="Если ваш бизнес уже есть в QalaGo, запросите доступ вместо создания новой карточки."
    >
      {items.length > 0 && (
        <div className="card card-muted" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Мои бизнесы</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((item) => (
              <li key={item.business.id} style={{ marginBottom: 8 }}>
                <Link href={`/business/${item.business.id}`}>
                  {item.business.title}
                </Link>
                {' · '}
                {membershipRoleLabel(item.access.role)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        <Link href="/onboarding/search" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          Найти существующий бизнес
        </Link>
        <Link href="/onboarding/apply" className="btn" style={{ justifyContent: 'center' }}>
          Добавить новый бизнес
        </Link>
        <Link href="/onboarding/applications" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
          Мои заявки
        </Link>
      </div>
    </OnboardingShell>
  );
}
