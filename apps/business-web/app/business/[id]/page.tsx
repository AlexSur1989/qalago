'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import { subcategoryDisplayName } from '@/lib/localized-content';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BusinessRow,
  findMyBusinessItem,
  MyBusinessItem,
  myBusinessRows,
  ownerApi,
  SubcategoryRow,
} from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell } from '@/components/business-shell';
import { parseApiError } from '@/lib/monetization-utils';
import {
  BusinessLocationField,
  type BusinessLocationState,
} from '@/components/business-location/business-location-field';
import { navLabelForId, ownerProfilePrimaryBranchCopy } from '@/lib/presentation';
import {
  buildProfileUpdatePayload,
  resolveProfileEditPermissions,
} from '@/lib/owner-profile-edit';

function parseHours(raw: BusinessRow['workHours']) {
  const weekdays = raw?.mon ?? raw?.tue ?? '09:00-22:00';
  return {
    weekdays,
    saturday: raw?.sat ?? weekdays,
    sunday: raw?.sun ?? weekdays,
  };
}

export default function BusinessEditPage() {
  const locale = useLocale();
  const ui = useUi();
  const primaryCopy = ownerProfilePrimaryBranchCopy(locale);

  const params = useParams<{ id: string }>();
  const id = params.id;
  const { token, user, ready, logout } = useAuth();
  const [myItems, setMyItems] = useState<MyBusinessItem[]>([]);
  const [location, setLocation] = useState<BusinessLocationState>({ address: '' });
  const [form, setForm] = useState({
    title: '',
    shortDesc: '',
    description: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    website: '',
    weekdays: '09:00-22:00',
    saturday: '09:00-22:00',
    sunday: '09:00-22:00',
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [taxonomySaved, setTaxonomySaved] = useState(false);

  const businesses = myBusinessRows(myItems);
  const business = businesses.find((b) => b.id === id) ?? null;
  const access = findMyBusinessItem(myItems, id)?.access ?? null;
  const permissions = useMemo(() => resolveProfileEditPermissions(access), [access]);

  async function refreshMyBusinesses() {
    if (!token) return;
    const res = await ownerApi.listMyBusinesses(token);
    setMyItems(res.items);
  }

  useEffect(() => {
    if (!token) return;
    refreshMyBusinesses().catch((err) => setError(parseApiError(locale, err)));
  }, [token, locale]);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      try {
        const b = await ownerApi.getBusiness(token, id);
        const hours = parseHours(b.workHours);
        setLocation({
          address: b.address ?? '',
          latitude: b.latitude != null ? Number(b.latitude) : undefined,
          longitude: b.longitude != null ? Number(b.longitude) : undefined,
          locationSource:
            b.locationSource === 'MANUALLY_ADJUSTED' ? 'MANUALLY_ADJUSTED' : 'GEOCODED',
        });
        setForm({
          title: b.title ?? '',
          shortDesc: b.shortDesc ?? '',
          description: b.description ?? '',
          phone: b.phone ?? '',
          whatsapp: b.whatsapp ?? '',
          instagram: b.instagram ?? '',
          website: b.website ?? '',
          ...hours,
        });
        const categoryId = b.categoryId ?? b.category?.id;
        if (categoryId) {
          const subs = await ownerApi.listSubcategories(categoryId);
          setSubcategories(subs);
        } else {
          setSubcategories([]);
        }
        const assigned = (b.subcategories ?? []).map((s) => s.id);
        setSelectedSubcategoryIds(assigned);
      } catch (err) {
        setError(parseApiError(locale, err));
      }
    })();
  }, [token, id, locale]);

  function toggleSubcategory(subId: string) {
    if (!permissions.canEditProfile) return;
    setSelectedSubcategoryIds((prev) =>
      prev.includes(subId) ? prev.filter((x) => x !== subId) : [...prev, subId],
    );
    setTaxonomySaved(false);
  }

  async function saveSubcategories() {
    if (!token || !permissions.canEditProfile) return;
    setError(null);
    setTaxonomySaved(false);
    try {
      await ownerApi.updateBusiness(token, id, { subcategoryIds: selectedSubcategoryIds });
      setTaxonomySaved(true);
      const b = await ownerApi.getBusiness(token, id);
      setSelectedSubcategoryIds((b.subcategories ?? []).map((s) => s.id));
    } catch (err) {
      setError(parseApiError(locale, err));
    }
  }

  async function saveProfileSection(e: FormEvent) {
    e.preventDefault();
    if (!token || !permissions.canEditProfile) return;
    setError(null);
    setProfileSaved(false);
    try {
      const payload = buildProfileUpdatePayload({
        permissions,
        form,
        location,
        includeProfile: true,
        includeHours: false,
      });
      if (Object.keys(payload).length === 0) return;
      await ownerApi.updateBusiness(token, id, payload);
      setProfileSaved(true);
      await refreshMyBusinesses();
    } catch (err) {
      setError(parseApiError(locale, err));
    }
  }

  async function saveHoursSection(e: FormEvent) {
    e.preventDefault();
    if (!token || !permissions.canEditHours) return;
    setError(null);
    setHoursSaved(false);
    try {
      const payload = buildProfileUpdatePayload({
        permissions,
        form,
        location,
        includeProfile: false,
        includeHours: true,
      });
      if (Object.keys(payload).length === 0) return;
      await ownerApi.updateBusiness(token, id, payload);
      setHoursSaved(true);
      await refreshMyBusinesses();
    } catch (err) {
      setError(parseApiError(locale, err));
    }
  }

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  const readOnlyProfile = !permissions.canEditProfile;
  const readOnlyHours = !permissions.canEditHours;

  return (
    <BusinessShell
      activeNav="profile"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>{ui.ownerMgmtMyBusiness}</h1>
          <p className="page-header-meta">{ui.____7beeae}</p>
        </div>
        <Link href="/dashboard" className="btn btn-ghost">{ui.text_76e286}</Link>
      </header>

      <section className="form-card" style={{ maxWidth: 720, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1rem' }}>{ui.text_ec65a7}</h2>
        <div className="quick-actions-grid">
          <Link href={`/business/${id}/media`} className="btn btn-sm">{ui.___244d38}</Link>
          <Link href={`/business/${id}/reviews`} className="btn btn-sm">{ui.text_e76db3}</Link>
          <Link href={`/business/${id}/menu`} className="btn btn-sm">{ui.___dcc139}</Link>
          <Link href={`/business/${id}/promotions`} className="btn btn-sm">{ui.text_8f1e4c}</Link>
          <Link href={`/business/${id}/locations`} className="btn btn-sm">
            {navLabelForId(locale, 'locations')}
          </Link>
        </div>
      </section>

      {subcategories.length > 0 && permissions.canEditProfile && (
        <section className="form-card form-grid" style={{ maxWidth: 720, marginBottom: 16 }}>
          <h3 className="form-section-title">{ui.text_125cda}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{ui.____2082c9}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {subcategories.map((sub) => {
              const active = selectedSubcategoryIds.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  className={`btn btn-sm ${active ? 'btn-primary' : ''}`}
                  onClick={() => toggleSubcategory(sub.id)}
                >
                  {subcategoryDisplayName(sub, locale)}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => void saveSubcategories()}>
            {ui.text_saveSubcategories}
          </button>
          {taxonomySaved && <div className="alert alert-success">{ui.__9b14e9}</div>}
        </section>
      )}

      {(permissions.canEditProfile || permissions.canEditHours) && (
        <form
          onSubmit={saveProfileSection}
          className="form-card form-grid"
          style={{ maxWidth: 720, marginBottom: 16 }}
        >
          {field(ui.text_602680, form.title, (v) => setForm({ ...form, title: v }), readOnlyProfile)}
          {field(ui.__62b685, form.shortDesc, (v) => setForm({ ...form, shortDesc: v }), readOnlyProfile)}
          {area(ui.text_38ca0a, form.description, (v) => setForm({ ...form, description: v }), readOnlyProfile)}

          <div className="form-section-title stack" style={{ gap: 8 }}>
            <h3 style={{ margin: 0 }}>{primaryCopy.sectionTitle}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
              {primaryCopy.sectionIntro}
            </p>
            <Link href={`/business/${id}/locations`} className="btn btn-sm">
              {primaryCopy.manageBranchesLink}
            </Link>
          </div>

          {token && (
            <BusinessLocationField
              locale={locale}
              token={token}
              citySlug={business?.city?.slug ?? 'uralsk'}
              value={location}
              onChange={setLocation}
              readOnly={readOnlyProfile}
              addressLabel={ui.text_80148f}
            />
          )}
          {field(ui.text_2928e1, form.phone, (v) => setForm({ ...form, phone: v }), readOnlyProfile)}
          {field('WhatsApp', form.whatsapp, (v) => setForm({ ...form, whatsapp: v }), readOnlyProfile)}
          {field('Instagram', form.instagram, (v) => setForm({ ...form, instagram: v }), readOnlyProfile)}
          {field(ui.text_61dee7, form.website, (v) => setForm({ ...form, website: v }), readOnlyProfile)}

          {permissions.canEditProfile && (
            <button type="submit" className="btn btn-primary">{ui.text_74ea58}</button>
          )}
          {profileSaved && <div className="alert alert-success">{ui.text_54a59b}</div>}
        </form>
      )}

      {(permissions.canEditProfile || permissions.canEditHours) && (
        <form onSubmit={saveHoursSection} className="form-card form-grid" style={{ maxWidth: 720 }}>
          <h3 className="form-section-title">{ui.__5e77e4}</h3>
          {field(ui.__255eae, form.weekdays, (v) => setForm({ ...form, weekdays: v }), readOnlyHours)}
          {field(ui.text_cee58b, form.saturday, (v) => setForm({ ...form, saturday: v }), readOnlyHours)}
          {field(ui.text_aa48fa, form.sunday, (v) => setForm({ ...form, sunday: v }), readOnlyHours)}
          {permissions.canEditHours && (
            <button type="submit" className="btn btn-primary">{ui.text_74ea58}</button>
          )}
          {hoursSaved && <div className="alert alert-success">{ui.text_54a59b}</div>}
        </form>
      )}

      {!permissions.canEditProfile && !permissions.canEditHours && (
        <p className="muted" style={{ maxWidth: 720 }}>
          {primaryCopy.sectionIntro}
        </p>
      )}

      {error && (
        <div className="alert alert-error" style={{ maxWidth: 720 }}>
          {error}
        </div>
      )}
    </BusinessShell>
  );
}

function field(
  label: string,
  value: string,
  onChange: (v: string) => void,
  readOnly = false,
) {
  return (
    <label>
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        disabled={readOnly}
      />
    </label>
  );
}

function area(
  label: string,
  value: string,
  onChange: (v: string) => void,
  readOnly = false,
) {
  return (
    <label>
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        readOnly={readOnly}
        disabled={readOnly}
      />
    </label>
  );
}
