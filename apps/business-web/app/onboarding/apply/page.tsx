'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryRow, CityRow, ownerApi } from '@/lib/api';
import { OnboardingShell } from '@/components/onboarding-shell';
import { useAuth } from '@/lib/use-auth';
import { mapOnboardingError } from '@/lib/onboarding-utils';

export default function OnboardingApplyPage() {
  return (
    <Suspense fallback={<OnboardingShell title="Добавить новый бизнес"><p>Загрузка…</p></OnboardingShell>}>
      <OnboardingApplyContent />
    </Suspense>
  );
}

function OnboardingApplyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  const { token, user } = useAuth();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [citySlug, setCitySlug] = useState('uralsk');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [status, setStatus] = useState<string>('DRAFT');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(applicationId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    ownerApi.listCategories().then((items) => {
      setCategories(items);
      if (items.length > 0) setCategoryId((prev) => prev || items[0].id);
    }).catch(() => undefined);
    ownerApi.listCities().then((items) => {
      setCities(items);
      if (items.length > 0) setCitySlug((prev) => prev || items[0].slug);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user?.phone, phone]);

  useEffect(() => {
    if (!token || !applicationId) return;
    ownerApi
      .getApplication(token, applicationId)
      .then((app) => {
        setDraftId(app.id);
        setTitle(app.title);
        setAddress(app.address);
        setCategoryId(app.category?.id ?? '');
        setCitySlug(app.city?.slug ?? 'uralsk');
        setPhone(app.phone ?? '');
        setShortDesc(app.shortDesc ?? '');
        setStatus(app.status);
        setRejectionReason(app.rejectionReason ?? null);
      })
      .catch((err: unknown) => setError(mapOnboardingError(String(err))));
  }, [token, applicationId]);

  const readOnly = status === 'PENDING' || status === 'APPROVED' || status === 'CANCELLED';
  const selectedCity = cities.find((c) => c.slug === citySlug);
  const comingSoon = selectedCity && 'launchStatus' in selectedCity
    ? (selectedCity as CityRow & { launchStatus?: string }).launchStatus === 'COMING_SOON'
    : false;

  async function saveDraft() {
    if (!token) return null;
    const payload = {
      title: title.trim(),
      categoryId,
      citySlug,
      address: address.trim(),
      phone: phone.trim() || undefined,
      shortDesc: shortDesc.trim() || undefined,
    };
    if (draftId) {
      return ownerApi.updateApplication(token, draftId, payload);
    }
    return ownerApi.createApplication(token, payload);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !categoryId || !address.trim() || !citySlug) {
      setError('Заполните название, категорию, город и адрес');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const app = await saveDraft();
      if (app) {
        setDraftId(app.id);
        setStatus(app.status);
        setSuccess('Черновик сохранён');
        router.replace(`/onboarding/apply?id=${app.id}`);
      }
    } catch (err: unknown) {
      setError(mapOnboardingError(String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!token || !draftId) {
      setError('Сначала сохраните черновик');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await saveDraft();
      const app = await ownerApi.submitApplication(token, draftId);
      setStatus(app.status);
      setSuccess('Заявка отправлена на проверку. Доступ к кабинету появится после одобрения.');
    } catch (err: unknown) {
      setError(mapOnboardingError(String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!token || !draftId) return;
    if (!window.confirm('Отменить заявку?')) return;
    setLoading(true);
    setError(null);
    try {
      const app = await ownerApi.cancelApplication(token, draftId);
      setStatus(app.status);
      setSuccess('Заявка отменена');
    } catch (err: unknown) {
      setError(mapOnboardingError(String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell title="Добавить новый бизнес" subtitle="Заявка будет проверена администрацией QalaGo.">
      {comingSoon && (
        <div className="alert" style={{ marginBottom: 16 }}>
          Бизнес будет доступен после запуска города.
        </div>
      )}
      {rejectionReason && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          Причина отклонения: {rejectionReason}
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSave} className="form-grid">
        <label>
          Город *
          <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} required disabled={readOnly}>
            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {city.nameRu}
              </option>
            ))}
          </select>
        </label>
        <label>
          Название *
          <input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={readOnly} />
        </label>
        <label>
          Категория *
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={readOnly}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Адрес *
          <input value={address} onChange={(e) => setAddress(e.target.value)} required disabled={readOnly} />
        </label>
        <label>
          Телефон
          <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={readOnly} />
        </label>
        <label>
          Краткое описание
          <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={3} disabled={readOnly} />
        </label>

        {!readOnly && (
          <>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Сохранение…' : 'Сохранить черновик'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Отправка…' : 'Отправить на проверку'}
            </button>
          </>
        )}

        {(status === 'DRAFT' || status === 'PENDING') && draftId && (
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={handleCancel}>
            Отменить заявку
          </button>
        )}

        {status === 'APPROVED' && (
          <Link href="/dashboard" className="btn btn-primary">
            Открыть кабинет
          </Link>
        )}
      </form>

      <p style={{ marginTop: 16 }}>
        <Link href="/onboarding/search">← Найти существующий бизнес</Link>
      </p>
    </OnboardingShell>
  );
}
