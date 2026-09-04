'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ownerApi, TOKEN_KEY } from '@/lib/api';

type AccountType = 'user' | 'business';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+77000000002');
  const [code, setCode] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('business');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function selectAccountType(next: AccountType) {
    setAccountType(next);
    if (next === 'business' && phone === '+77000000003') {
      setPhone('+77000000002');
    }
    if (next === 'user' && phone === '+77000000002') {
      setPhone('+77000000003');
    }
  }

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

  async function verify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ownerApi.verifyCode(phone, code, accountType);
      if (
        res.user.role !== 'BUSINESS' &&
        res.user.role !== 'ADMIN' &&
        res.user.role !== 'CITY_ADMIN' &&
        res.user.role !== 'USER'
      ) {
        setError('Нет доступа к кабинету');
        return;
      }
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      if (res.user.role === 'USER' && accountType === 'business') {
        router.push('/register');
        return;
      }
      router.push('/dashboard');
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
        <p>Кабинет владельца заведения · OTP (тест: +77000000002, код 1234)</p>

        <div className="account-type-grid" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`account-type-card${accountType === 'business' ? ' selected' : ''}`}
            onClick={() => selectAccountType('business')}
          >
            <strong>Бизнес</strong>
            <span>Кабинет заведения</span>
          </button>
          <button
            type="button"
            className={`account-type-card${accountType === 'user' ? ' selected' : ''}`}
            onClick={() => selectAccountType('user')}
          >
            <strong>Пользователь</strong>
            <span>Только просмотр каталога</span>
          </button>
        </div>

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
            {accountType === 'business' ? 'Войти / зарегистрироваться' : 'Войти'}
          </button>
        </form>
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
        <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Нет заведения?{' '}
          <Link href="/register" style={{ color: 'var(--primary)' }}>
            Зарегистрировать
          </Link>
        </p>
      </div>
    </main>
  );
}
