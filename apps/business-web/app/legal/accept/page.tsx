'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  legalApi,
  type LegalPendingDocument,
  userRequiresPlatformLegalAcceptance,
} from '@/lib/api';
import { publicLegalUrl } from '@/lib/legal-config';
import { resolveBusinessAccessToken } from '@/lib/business-auth-bootstrap';
import { loadCanonicalBusinessUser } from '@/lib/business-auth-session';
import { sanitizeInternalRedirect } from '@/lib/redirect-utils';
import { useLocale } from '@/components/locale-provider';

export default function LegalAcceptPage() {
  const router = useRouter();
  const params = useSearchParams();
  const locale = useLocale();
  const [pending, setPending] = useState<LegalPendingDocument[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await resolveBusinessAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      const user = await loadCanonicalBusinessUser(token);
      if (!user.ok || !userRequiresPlatformLegalAcceptance(user.user.role)) {
        router.replace('/dashboard');
        return;
      }
      const legal = await legalApi.fetchCurrent(token, locale === 'kk' ? 'KK' : 'RU');
      if (!legal.acceptanceRequired) {
        const redirect = sanitizeInternalRedirect(params.get('redirect'));
        router.replace(redirect ?? '/dashboard');
        return;
      }
      setPending(legal.pendingAcceptance);
    } catch {
      setError(locale === 'kk' ? 'Қате орын алды' : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }, [locale, params, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!confirmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await resolveBusinessAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      await legalApi.acceptRequired(token, pending, locale === 'kk' ? 'KK' : 'RU');
      const redirect = sanitizeInternalRedirect(params.get('redirect'));
      router.replace(redirect ?? '/dashboard');
    } catch {
      setError(
        locale === 'kk'
          ? 'Құжаттарды қабылдау сақталмады'
          : 'Не удалось сохранить принятие документов',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="login-page">
        <p>{locale === 'kk' ? 'Жүктелуде…' : 'Загрузка…'}</p>
      </main>
    );
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>{locale === 'kk' ? 'Құқықтық құжаттар' : 'Правовые документы'}</h1>
        <p>
          {locale === 'kk'
            ? 'Жалғастыру үшін ағымдағы шарттар мен құпиялылық саясатын растаңыз.'
            : 'Чтобы продолжить, подтвердите актуальные Условия и Политику конфиденциальности.'}
        </p>
        <ul>
          {pending.map((doc) => (
            <li key={doc.documentId}>
              {doc.publicUrl ? (
                <Link href={doc.publicUrl} target="_blank" rel="noopener noreferrer">
                  {doc.type} (v{doc.version})
                </Link>
              ) : (
                <span>
                  {doc.type} (v{doc.version})
                </span>
              )}
            </li>
          ))}
        </ul>
        <label>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(ev) => setConfirmed(ev.target.checked)}
          />{' '}
          {locale === 'kk'
            ? 'Мен шарттар мен саясатты қабылдаймын'
            : 'Я принимаю Условия и ознакомлен(а) с Политикой'}
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={!confirmed || submitting}>
          {locale === 'kk' ? 'Жалғастыру' : 'Продолжить'}
        </button>
      </form>
    </main>
  );
}
