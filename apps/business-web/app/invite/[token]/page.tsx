'use client';

import { useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ownerApi, ResolvedInvitation } from '@/lib/api';
import { getWebAccessToken, setWebAccessToken } from '@/lib/web-auth-token';

export default function InviteAcceptPage() {
  const ui = useUi();

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
      setError(ui.____a2e9ce);
      setResolved(null);
    } finally {
      setLoading(false);
    }
  }, [inviteToken]);

  useEffect(() => {
    async function bootstrapAuth() {
      let token = getWebAccessToken();
      if (!token) {
        try {
          const res = await fetch('/api/auth/refresh', { method: 'POST' });
          if (res.ok) {
            const data = (await res.json()) as { accessToken: string };
            token = data.accessToken;
            setWebAccessToken(token);
          }
        } catch {
          token = null;
        }
      }
      setAuthToken(token);
      void loadInvitation();
    }
    void bootstrapAuth();
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
      setError(ui.____4734e7);
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="login-page">
        <div className="login-card">
          <p>{ui.__ee11a4}</p>
        </div>
      </main>
    );
  }

  if (!resolved) {
    return (
      <main className="login-page">
        <div className="login-card">
          <h1>{ui.text_0d1896}</h1>
          <div className="alert alert-error">{error ?? ui.__99d79f}</div>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>{ui.___088df3}</Link>
        </div>
      </main>
    );
  }

  const statusMessage =
    resolved.status === 'PENDING'
      ? ui.__9376fb
      : resolved.status === 'ACCEPTED'
        ? ui.__f626fa
        : resolved.status === 'REVOKED'
          ? ui.text_2b1305
          : ui.___6de80c;

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>{ui.___f97529}</h1>
        <p className="login-lead">{ui.____055069}<strong>{resolved.businessName}</strong>.
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
            <p style={{ marginTop: 20 }}>{ui.__qalago__d094f0}</p>
            <Link href={loginHref} className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>{ui.____0b5072}</Link>
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
            {accepting ? ui.text_ddfaba : ui.__343d9a}
          </button>
        )}

        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </main>
  );
}
