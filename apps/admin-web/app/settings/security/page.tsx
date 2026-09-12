'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';
import { fetchStaffMfaStatus, startStaffMfaEnroll, verifyStaffMfaEnroll } from '@/lib/staff-mfa-api';
import { setWebAccessToken } from '@/lib/web-auth-token';
import { QRCodeSVG } from 'qrcode.react';

export default function SecuritySettingsPage() {
  const { token, ready } = useAuth();
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchStaffMfaStatus>> | null>(null);
  const [enroll, setEnroll] = useState<{ otpauthUri: string; secret: string } | null>(null);
  const [totp, setTotp] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchStaffMfaStatus(token)
      .then(setStatus)
      .catch((e) => setError(String(e)));
  }, [token]);

  async function onStart() {
    if (!token) return;
    const res = await startStaffMfaEnroll(token);
    setEnroll({ otpauthUri: res.otpauthUri, secret: res.secret });
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const res = await verifyStaffMfaEnroll(token, totp);
    if (res.accessToken) setWebAccessToken(res.accessToken);
    alert(`Сохраните коды:\n${res.recoveryCodes.join('\n')}`);
    setEnroll(null);
    setStatus(await fetchStaffMfaStatus(token));
  }

  if (!ready) return null;

  return (
    <div className="report-page">
      <Link href="/settings">← Настройки</Link>
      <h1>Безопасность · MFA</h1>
      {status?.enabled ? (
        <p>Двухфакторная защита включена. Резервных кодов: {status.recoveryCodesRemaining}</p>
      ) : (
        <p className="muted">MFA не настроена.</p>
      )}
      {!status?.enabled && !enroll ? (
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Настроить двухфакторную защиту
        </button>
      ) : null}
      {enroll ? (
        <>
          <QRCodeSVG value={enroll.otpauthUri} size={160} />
          <p>
            Ключ: <code>{enroll.secret}</code>
          </p>
          <form onSubmit={onVerify}>
            <input value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="6 цифр" />
            <button type="submit" className="btn btn-primary">
              Подтвердить
            </button>
          </form>
        </>
      ) : null}
      {error ? <p>{error}</p> : null}
    </div>
  );
}
