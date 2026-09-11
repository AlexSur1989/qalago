'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuthUser } from '@/lib/api';
import { setWebAccessToken } from '@/lib/web-auth-token';
import { adminWebDevLoginEnabled, devSeedAccounts } from '@/lib/auth-config';
import { canAccessAdminWeb } from '@/lib/rbac';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+77000000001');
  const [code, setCode] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finishLogin(accessToken: string, user: AuthUser) {
    if (!canAccessAdminWeb(user.role)) {
      setError('Доступ только для администраторов платформы');
      return;
    }
    setWebAccessToken(accessToken);
    router.push('/dashboard');
  }

  async function loginViaSession(mode: 'verify' | 'dev', payload: { phone: string; code?: string }) {
    const res = await fetch('/api/auth/login', {
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
    return res.json() as Promise<{ accessToken: string; user: AuthUser }>;
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
      await finishLogin(res.accessToken, res.user);
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
      await finishLogin(res.accessToken, res.user);
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
        <p style={{ color: 'var(--text-muted)' }}>Вход для администраторов платформы</p>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
          <div><strong>SUPER_ADMIN</strong> · +77000000001</div>
          <div><strong>ADMIN</strong> · +77000000005</div>
          <div><strong>CITY_ADMIN</strong> · +77000000004 · Актобе</div>
          <div style={{ marginTop: 6 }}>OTP: 1234</div>
        </div>
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
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </main>
  );
}
