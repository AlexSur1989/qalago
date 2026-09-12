'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  fetchStaffMfaStatus,
  startStaffMfaEnroll,
  verifyStaffMfaEnroll,
} from '@/lib/staff-mfa-api';
import { getWebAccessToken, setWebAccessToken } from '@/lib/web-auth-token';

export default function MfaSetupPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totp, setTotp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const access = getWebAccessToken();
    if (!access) {
      router.replace('/login');
      return;
    }
    setToken(access);
    fetchStaffMfaStatus(access)
      .then((s) => {
        if (s.enabled) {
          router.replace('/dashboard');
          return;
        }
        if (!s.enrollmentRequired && !s.requiresMfa) {
          router.replace('/settings/security');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function begin() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await startStaffMfaEnroll(token);
      setOtpauthUri(res.otpauthUri);
      setSecret(res.secret);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verifyStaffMfaEnroll(token, totp);
      if (res.accessToken) {
        setWebAccessToken(res.accessToken);
      }
      setRecoveryCodes(res.recoveryCodes);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (recoveryCodes) {
    return (
      <main className="login-page">
        <div className="login-card" style={{ maxWidth: 480 }}>
          <h1>Резервные коды</h1>
          <p className="muted">
            Сохраните резервные коды. После закрытия этой страницы они больше не будут показаны.
          </p>
          <ul style={{ fontFamily: 'monospace', lineHeight: 1.8 }}>
            {recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary" onClick={() => router.push('/dashboard')}>
            Перейти в админку
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <h1>Двухфакторная защита</h1>
        <p className="muted">
          Двухфакторная защита обязательна для суперадминистратора. Настройте приложение Google
          Authenticator или аналог.
        </p>
        {!otpauthUri ? (
          <button type="button" className="btn btn-primary" disabled={loading || !token} onClick={begin}>
            Настроить двухфакторную защиту
          </button>
        ) : (
          <>
            {otpauthUri ? (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                <QRCodeSVG value={otpauthUri} size={180} />
              </div>
            ) : null}
            <p style={{ fontSize: 13 }}>
              Ключ вручную: <code>{secret}</code>
            </p>
            <form onSubmit={confirm} className="form-grid">
              <input
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Код из приложения (6 цифр)"
                inputMode="numeric"
              />
              <button type="submit" className="btn btn-primary" disabled={loading || totp.length !== 6}>
                Подтвердить
              </button>
            </form>
          </>
        )}
        {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
      </div>
    </main>
  );
}
