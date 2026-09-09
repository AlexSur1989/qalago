'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ownerApi, ResolvedInvitation, TOKEN_KEY } from '@/lib/api';

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const inviteToken = params.token;

  const [resolved, setResolved] = useState<ResolvedInvitation | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginHref = `/login?redirect=${encodeURIComponent(`/invite/${inviteToken}`)}`;

  const loadInvitation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ownerApi.resolveInvitation(inviteToken);
      setResolved(data);
    } catch (err) {
      setError('Приглашение не найдено или ссылка недействительна.');
      setResolved(null);
    } finally {
      setLoading(false);
    }
  }, [inviteToken]);

  useEffect(() => {
    setAuthToken(localStorage.getItem(TOKEN_KEY));
    void loadInvitation();
  }, [loadInvitation]);

  async function acceptInvite() {
    if (!authToken || !resolved || resolved.status !== 'PENDING') return;
    setAccepting(true);
    setError(null);
    try {
      const result = await ownerApi.acceptInvitation(authToken, inviteToken);
      localStorage.setItem('qalago_business_id', result.businessId);
      router.push(`/business/${result.businessId}/dashboard`);
    } catch (err) {
      setError('Не удалось принять приглашение. Попробуйте ещё раз.');
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="login-page">
        <div className="login-card">
          <p>Загрузка приглашения…</p>
        </div>
      </main>
    );
  }

  if (!resolved) {
    return (
      <main className="login-page">
        <div className="login-card">
          <h1>Приглашение</h1>
          <div className="alert alert-error">{error ?? 'Приглашение недоступно.'}</div>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
            На страницу входа
          </Link>
        </div>
      </main>
    );
  }

  const statusMessage =
    resolved.status === 'PENDING'
      ? 'Ожидает принятия'
      : resolved.status === 'ACCEPTED'
        ? 'Уже принято'
        : resolved.status === 'REVOKED'
          ? 'Отозвано'
          : 'Срок действия истёк';

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>Приглашение в команду</h1>
        <p className="login-lead">
          Вас приглашают управлять заведением <strong>{resolved.businessName}</strong>.
        </p>
        {resolved.recipientEmailMasked && (
          <p style={{ color: 'var(--text-muted)' }}>
            Адресат: {resolved.recipientEmailMasked}
          </p>
        )}
        <p style={{ color: 'var(--text-muted)' }}>Статус: {statusMessage}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Действует до: {new Date(resolved.expiresAt).toLocaleString('ru-RU')}
        </p>

        {resolved.status === 'PENDING' && !authToken && (
          <>
            <p style={{ marginTop: 20 }}>
              Войдите в QalaGo, чтобы принять приглашение.
            </p>
            <Link href={loginHref} className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
              Войти и принять приглашение
            </Link>
          </>
        )}

        {resolved.status === 'PENDING' && authToken && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 20 }}
            disabled={accepting}
            onClick={() => void acceptInvite()}
          >
            {accepting ? 'Принимаем…' : 'Принять приглашение'}
          </button>
        )}

        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </main>
  );
}
