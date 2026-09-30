'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryRow, CityRow, ownerApi } from '@/lib/api';
import { OnboardingShell } from '@/components/onboarding-shell';
import { useAuth } from '@/lib/use-auth';
import { mapOnboardingError } from '@/lib/onboarding-utils';
import { cityDisplayName } from '@/lib/localized-content';
import { businessLocationRequired, onboardingRejectionBannerLabel } from '@/lib/presentation';
import {
  BusinessLocationField,
  type BusinessLocationState,
} from '@/components/business-location/business-location-field';
import { backofficeConfirm } from '@qalago/brand/confirm';

export default function OnboardingApplyPage() {
  const locale = useLocale();
  const ui = useUi();

  return (
    <Suspense fallback={<OnboardingShell title={ui.___61b180}><p>{ui.text_89d69a}</p></OnboardingShell>}>
      <OnboardingApplyContent />
    </Suspense>
  );
}

function OnboardingApplyContent() {
  const locale = useLocale();
  const ui = useUi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  const { token, user } = useAuth();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [citySlug, setCitySlug] = useState('uralsk');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState<BusinessLocationState>({ address: '' });
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
        setLocation({
          address: app.address,
          latitude: app.latitude != null ? Number(app.latitude) : undefined,
          longitude: app.longitude != null ? Number(app.longitude) : undefined,
          locationSource:
            app.locationSource === 'MANUALLY_ADJUSTED' ? 'MANUALLY_ADJUSTED' : 'GEOCODED',
        });
        setCategoryId(app.category?.id ?? '');
        setCitySlug(app.city?.slug ?? 'uralsk');
        setPhone(app.phone ?? '');
        setShortDesc(app.shortDesc ?? '');
        setStatus(app.status);
        setRejectionReason(app.rejectionReason ?? null);
      })
      .catch((err: unknown) => setError(mapOnboardingError(locale, String(err))));
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
      address: location.address.trim(),
      ...(location.latitude != null && location.longitude != null
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            locationSource: location.locationSource ?? 'GEOCODED',
          }
        : {}),
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
    if (!title.trim() || !categoryId || !location.address.trim() || !citySlug) {
      setError(ui.____d37b94);
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
        setSuccess(ui.__815828);
        router.replace(`/onboarding/apply?id=${app.id}`);
      }
    } catch (err: unknown) {
      setError(mapOnboardingError(locale, String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!token || !draftId) {
      setError(ui.___93a01e);
      return;
    }
    if (location.latitude == null || location.longitude == null) {
      setError(businessLocationRequired(locale));
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await saveDraft();
      const app = await ownerApi.submitApplication(token, draftId);
      setStatus(app.status);
      setSuccess(ui.____6df43a);
    } catch (err: unknown) {
      setError(mapOnboardingError(locale, String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!token || !draftId) return;
    if (!(await backofficeConfirm({ title: ui.__c50c8f, variant: 'warning' }))) return;
    setLoading(true);
    setError(null);
    try {
      const app = await ownerApi.cancelApplication(token, draftId);
      setStatus(app.status);
      setSuccess(ui.__3f888c);
    } catch (err: unknown) {
      setError(mapOnboardingError(locale, String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell title={ui.___61b180} subtitle={ui.____82ba6a}>
      {comingSoon && (
        <div className="alert" style={{ marginBottom: 16 }}>{ui.____aecd3d}</div>
      )}
      {rejectionReason && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {onboardingRejectionBannerLabel(locale)} {rejectionReason}
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSave} className="form-grid">
        <label>{ui.text_d0bf2a}<select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} required disabled={readOnly}>
            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {cityDisplayName({ nameRu: city.nameRu, nameKk: city.nameKk }, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>{ui.text_69eca8}<input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={readOnly} />
        </label>
        <label>{ui.text_d71ec3}<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={readOnly}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {token && (
          <BusinessLocationField
            locale={locale}
            token={token}
            citySlug={citySlug}
            value={location}
            onChange={setLocation}
            readOnly={readOnly}
            addressLabel={ui.text_6a21b9}
          />
        )}
        <label>{ui.text_2928e1}<input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={readOnly} />
        </label>
        <label>{ui.__62b685}<textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={3} disabled={readOnly} />
        </label>

        {!readOnly && (
          <>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? ui.text_73dba4 : ui.__e2b6e8}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? ui.text_a2aa4c : ui.___9665e7}
            </button>
          </>
        )}

        {(status === 'DRAFT' || status === 'PENDING') && draftId && (
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={handleCancel}>{ui.__5453e6}</button>
        )}

        {status === 'APPROVED' && (
          <Link href="/dashboard" className="btn btn-primary">{ui.__399e64}</Link>
        )}
      </form>

      <p style={{ marginTop: 16 }}>
        <Link href="/onboarding/search">{ui.___74b465}</Link>
      </p>
    </OnboardingShell>
  );
}
