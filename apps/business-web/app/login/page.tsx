'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ownerApi, TOKEN_KEY } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
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

  async function verify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ownerApi.verifyCode(phone, code);
      if (
        res.user.role !== 'BUSINESS' &&
        res.user.role !== 'ADMIN' &&
        res.user.role !== 'CITY_ADMIN'
      ) {
        setError('Доступ для владельцев бизнеса (BUSINESS)');
        return;
      }
      localStorage.setItem(TOKEN_KEY, res.accessToken);
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
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </main>
  );
}
