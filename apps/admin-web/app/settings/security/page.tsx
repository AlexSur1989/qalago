'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StaffMfaEnrollment } from '@/components/staff-mfa-enrollment';
import { ensureStaffAccessToken } from '@/lib/ensure-staff-access-token';
import { fetchStaffMfaStatus } from '@/lib/staff-mfa-api';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [recoveryRemaining, setRecoveryRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const access = await ensureStaffAccessToken();
      if (!access) {
        router.replace('/login');
        return;
      }
      setToken(access);
      try {
        const s = await fetchStaffMfaStatus(access);
        setEnabled(s.enabled);
        setRecoveryRemaining(s.recoveryCodesRemaining);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [router]);

  if (enabled === null && !error) return null;

  return (
    <div className="report-page">
      <Link href="/dashboard">← Админка</Link>
      <h1>Безопасность · MFA</h1>
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
