'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StaffMfaEnrollment } from '@/components/staff-mfa-enrollment';
import { ensureStaffAccessToken } from '@/lib/ensure-staff-access-token';
import { fetchStaffMfaStatus } from '@/lib/staff-mfa-api';
import { shouldRedirectMfaSetupAway } from '@/lib/staff-mfa-enrollment-ui';

export default function MfaSetupPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const access = await ensureStaffAccessToken();
      if (cancelled) return;
      if (!access) {
        router.replace('/login?next=/mfa/setup');
        return;
      }
      setToken(access);
      try {
        const status = await fetchStaffMfaStatus(access);
        if (shouldRedirectMfaSetupAway(status)) {
          router.replace('/dashboard');
        }
      } catch {
        setBootError('Не удалось загрузить статус MFA. Проверьте вход и API.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (bootError) {
    return (
      <main className="login-page">
        <div className="login-card">
          <p style={{ color: 'var(--danger)' }}>{bootError}</p>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="login-page">
        <div className="login-card">
          <p className="muted">Загрузка…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <StaffMfaEnrollment token={token} onComplete={() => router.push('/dashboard')} />
    </main>
  );
}
