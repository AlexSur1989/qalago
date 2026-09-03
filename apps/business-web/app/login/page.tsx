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
    <main style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 12 }}>
      <h1>QalaGo Business</h1>
      <p style={{ color: '#666' }}>Кабинет владельца · OTP (тест: +77000000002)</p>
      <form onSubmit={sendCode} style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон"
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading} style={{ padding: 10, borderRadius: 8 }}>
          Отправить код
        </button>
      </form>
      {debugCode && <p style={{ color: '#0a0' }}>Dev OTP: {debugCode}</p>}
      <form onSubmit={verify} style={{ display: 'grid', gap: 12 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Код из SMS"
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading} style={{ padding: 10, borderRadius: 8 }}>
          Войти
        </button>
      </form>
      {error && <p style={{ color: 'crimson', marginTop: 16 }}>{error}</p>}
    </main>
  );
}
