'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ownerApi, TOKEN_KEY } from '@/lib/api';
import { businessWebDevLoginEnabled } from '@/lib/auth-config';
import { devSeedAccounts } from '@/lib/dev-seed-accounts';
import { hasBusinessCabinetAccess } from '@/lib/use-auth';

function sanitizeRedirect(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  return raw;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page"><p>Загрузка…</p></main>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = sanitizeRedirect(searchParams.get('redirect'));

  const [phone, setPhone] = useState('+77000000002');
  const [code, setCode] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ownerApi.sendCode(phone);
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

  async function finishLogin(accessToken: string, user: Awaited<ReturnType<typeof ownerApi.verifyCode>>['user']) {
    let items: Awaited<ReturnType<typeof ownerApi.listMyBusinesses>>['items'] = [];
    try {
      const res = await ownerApi.listMyBusinesses(accessToken);
      items = res.items;
    } catch {
      setError('Не удалось проверить доступ к заведениям');
      return;
    }

    if (!hasBusinessCabinetAccess(user, items) && user.role !== 'USER') {
      setError('Нет доступа к кабинету');
      return;
    }

    localStorage.setItem(TOKEN_KEY, accessToken);

    if (redirectParam) {
      router.push(redirectParam);
      return;
    }

    if (hasBusinessCabinetAccess(user, items)) {
      router.push('/dashboard');
      return;
    }

    router.push('/onboarding');
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ownerApi.verifyCode(phone, code, 'user');
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
      const res = await ownerApi.devLogin(nextPhone);
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
        <h1>QalaGo Business</h1>
        <p>Вход по номеру телефона · OTP (тест: +77000000002, код 1234)</p>

        <form onSubmit={sendCode} className="form-grid" style={{ marginBottom: 24 }}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Телефон"
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            Отправить код
          </button>
        </form>
        {debugCode && <p style={{ color: 'var(--success)' }}>Dev OTP: {debugCode}</p>}
        <form onSubmit={verify} className="form-grid">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код из SMS"
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            Войти
          </button>
        </form>
        {businessWebDevLoginEnabled && (
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
        <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Нет бизнеса в QalaGo?{' '}
          <Link href="/onboarding" style={{ color: 'var(--primary)' }}>
            Добавить или найти
          </Link>
        </p>
      </div>
    </main>
  );
}
