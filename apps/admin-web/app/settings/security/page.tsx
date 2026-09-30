'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StaffMfaEnrollment } from '@/components/staff-mfa-enrollment';
import { useAuth } from '@/lib/use-auth';
import { fetchStaffMfaStatus } from '@/lib/staff-mfa-api';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [recoveryRemaining, setRecoveryRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    void (async () => {
      try {
        const s = await fetchStaffMfaStatus(token);
        setEnabled(s.enabled);
        setRecoveryRemaining(s.recoveryCodesRemaining);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [ready, token, router]);

  if (!ready || (enabled === null && !error)) {
    return <p className="muted">Загрузка…</p>;
  }

  return (
    <div className="shell-page-body">
      <h2 className="section-title">Безопасность · MFA</h2>
      {enabled ? (
        <p>
          Двухфакторная защита включена. Неиспользованных резервных кодов: {recoveryRemaining}
        </p>
      ) : (
        <>
          <p className="muted">MFA не настроена. Настройка через приложение Authenticator (TOTP).</p>
          {token ? (
            <StaffMfaEnrollment
              token={token}
              onEnrolled={() => {
                setEnabled(true);
                void fetchStaffMfaStatus(token).then((s) => setRecoveryRemaining(s.recoveryCodesRemaining));
              }}
              onComplete={() => router.push('/dashboard')}
            />
          ) : null}
        </>
      )}
      {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
    </div>
  );
}
