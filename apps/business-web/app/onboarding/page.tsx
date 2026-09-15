'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { OnboardingShell } from '@/components/onboarding-shell';
import { useAuth } from '@/lib/use-auth';
import { membershipRoleLabel } from '@/lib/onboarding-utils';

export default function OnboardingStartPage() {
  const locale = useLocale();
  const ui = useUi();

  const { items } = useAuth();

  return (
    <OnboardingShell
      title={ui.____1d1da5}
      subtitle={ui.____abe66e}
    >
      {items.length > 0 && (
        <div className="card card-muted" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>{ui.__94ed98}</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((item) => (
              <li key={item.business.id} style={{ marginBottom: 8 }}>
                <Link href={`/business/${item.business.id}`}>
                  {item.business.title}
                </Link>
                {' · '}
                {membershipRoleLabel(locale, item.access.role)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        <Link href="/onboarding/search" className="btn btn-primary" style={{ justifyContent: 'center' }}>{ui.___bcbf37}</Link>
        <Link href="/onboarding/apply" className="btn" style={{ justifyContent: 'center' }}>{ui.___61b180}</Link>
        <Link href="/onboarding/applications" className="btn btn-ghost" style={{ justifyContent: 'center' }}>{ui.__3da024}</Link>
      </div>
    </OnboardingShell>
  );
}
