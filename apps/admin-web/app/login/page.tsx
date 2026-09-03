'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, TOKEN_KEY } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+77000000001');
  const [code, setCode] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const res = await adminApi.verifyCode(phone, code);
      if (res.user.role !== 'ADMIN' && res.user.role !== 'CITY_ADMIN') {
        setError('Доступ только для ADMIN / CITY_ADMIN');
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
        <h1 style={{ marginTop: 0, color: 'var(--primary)' }}>QalaGo Admin</h1>
        <p style={{ color: 'var(--text-muted)' }}>Вход для ADMIN и CITY_ADMIN</p>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
          <div><strong>ADMIN</strong> · +77000000001</div>
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
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </main>
  );
}
