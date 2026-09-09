'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BusinessRow, ownerApi } from '@/lib/api';
import { OnboardingShell } from '@/components/onboarding-shell';
import { useAuth } from '@/lib/use-auth';
import { mapOnboardingError } from '@/lib/onboarding-utils';

export default function OnboardingClaimPage() {
  const params = useParams<{ businessId: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [business, setBusiness] = useState<BusinessRow | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    ownerApi
      .getBusiness(token, params.businessId)
      .then(setBusiness)
      .catch((err: unknown) => setError(mapOnboardingError(String(err))))
      .finally(() => setLoading(false));
  }, [token, params.businessId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await ownerApi.createOwnershipClaim(token, params.businessId, {
        claimantMessage: message.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(mapOnboardingError(String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <OnboardingShell title="Подтверждение прав">
        <p>Загрузка…</p>
      </OnboardingShell>
    );
  }

  if (success) {
    return (
      <OnboardingShell title="Заявка отправлена">
        <p>Мы сообщим о результате после проверки.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <Link href="/onboarding/claims" className="btn btn-primary">
            Мои заявки
          </Link>
          <Link href="/onboarding" className="btn">
            На главную
          </Link>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      title="Подтвердить права владельца"
      subtitle="Заявка будет проверена администрацией QalaGo."
    >
      {business && (
        <div className="card card-muted" style={{ marginBottom: 16 }}>
          <strong>{business.title}</strong>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {business.address}
          </p>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} className="form-grid">
        <label>
          Сообщение для модератора (необязательно)
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={500}
            disabled={submitting}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Отправка…' : 'Отправить заявку'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          ← Назад
        </button>
      </p>
    </OnboardingShell>
  );
}
