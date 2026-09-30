'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi, AuthUser } from '@/lib/api';
import { resetAdminAuthBootstrapState } from '@/lib/admin-auth-bootstrap';
import { setWebAccessToken } from '@/lib/web-auth-token';
import {
  adminWebDevLoginEnabled,
  devSeedAccounts,
  devSuperAdminManualHintRu,
} from '@/lib/auth-config';
import { canAccessAdminWeb } from '@/lib/rbac';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaTotp, setMfaTotp] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  async function finishLogin(
    accessToken: string,
    user: AuthUser,
    opts?: { enrollmentRequired?: boolean },
  ) {
    if (!canAccessAdminWeb(user.role)) {
      setError('Доступ только для администраторов платформы');
      return;
    }
    resetAdminAuthBootstrapState();
    setWebAccessToken(accessToken);
    if (opts?.enrollmentRequired) {
      router.push('/mfa/setup');
      return;
    }
    const safeNext =
      nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
    router.push(safeNext ?? '/dashboard');
  }

  async function loginViaSession(mode: 'verify' | 'dev', payload: { phone: string; code?: string }) {
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        mode === 'dev'
          ? { mode: 'dev', phone: payload.phone }
          : { mode: 'verify', phone: payload.phone, code: payload.code },
      ),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json() as Promise<{
      accessToken?: string;
      user: AuthUser;
      mfaRequired?: boolean;
      mfaChallengeToken?: string;
      enrollmentRequired?: boolean;
    }>;
  }

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.sendCode(phone);
      if (res.debugCode) {
        setDebugCode(res.debugCode);
        setCode(res.debugCode);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginViaSession('verify', { phone, code });
      if (res.mfaRequired && res.mfaChallengeToken) {
        setMfaChallengeToken(res.mfaChallengeToken);
        return;
      }
      if (!res.accessToken) {
        setError('Неполный ответ сервера');
        return;
      }
      await finishLogin(res.accessToken, res.user, {
        enrollmentRequired: res.enrollmentRequired,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function submitMfa(e: FormEvent) {
    e.preventDefault();
    if (!mfaChallengeToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/admin/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaChallengeToken,
          totp: useRecovery ? undefined : mfaTotp,
          recoveryCode: useRecovery ? recoveryCode : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { accessToken: string; user: AuthUser };
      await finishLogin(data.accessToken, data.user);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function devLogin(nextPhone = phone) {
    setLoading(true);
    setError(null);
    try {
      const res = await loginViaSession('dev', { phone: nextPhone });
      if (res.mfaRequired && res.mfaChallengeToken) {
        setMfaChallengeToken(res.mfaChallengeToken);
        return;
      }
      if (!res.accessToken) {
        setError('Неполный ответ сервера');
        return;
      }
      await finishLogin(res.accessToken, res.user, {
        enrollmentRequired: res.enrollmentRequired,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1 style={{ marginTop: 0, color: 'var(--primary)' }}>QalaGo Admin</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {mfaChallengeToken ? 'Подтверждение двухфакторной защиты' : 'Вход для администраторов платформы'}
        </p>
        {mfaChallengeToken ? (
          <form onSubmit={submitMfa} className="form-grid">
            {!useRecovery ? (
              <input
                value={mfaTotp}
                onChange={(e) => setMfaTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Код из приложения"
                inputMode="numeric"
              />
            ) : (
              <input
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="Резервный код"
              />
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Продолжить
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setUseRecovery((v) => !v)}
            >
              {useRecovery ? 'Использовать приложение' : 'Использовать резервный код'}
            </button>
          </form>
        ) : null}
        {adminWebDevLoginEnabled && !mfaChallengeToken ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            <div>{devSuperAdminManualHintRu}</div>
          </div>
        ) : null}
        {!mfaChallengeToken ? (
          <>
            <form onSubmit={sendCode} className="form-grid" style={{ marginBottom: 24 }}>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
              <button type="submit" disabled={loading} className="btn btn-primary">
                Отправить код
              </button>
            </form>
            {debugCode && <p style={{ color: 'var(--success)' }}>Dev OTP: {debugCode}</p>}
            <form onSubmit={verify} className="form-grid">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Код из SMS" />
              <button type="submit" disabled={loading} className="btn btn-primary">
                Войти
              </button>
            </form>
            {adminWebDevLoginEnabled && (
              <>
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 16, width: '100%' }}
                  disabled={loading}
                  onClick={() => devLogin()}
                >
                  Войти без SMS
                </button>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {devSeedAccounts.map((account) => (
                    <button
                      key={account.phone}
                      type="button"
                      className="btn"
                      disabled={loading}
                      onClick={() => {
                        setPhone(account.phone);
                        void devLogin(account.phone);
                      }}
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page"><div className="login-card">Загрузка…</div></main>}>
      <LoginPageContent />
    </Suspense>
  );
}
