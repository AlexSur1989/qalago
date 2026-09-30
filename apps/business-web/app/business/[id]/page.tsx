'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import { subcategoryDisplayName } from '@/lib/localized-content';
import Link from 'next/link';
import { type ComponentProps, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { BUSINESS_ROUTE_ACCESS, useBusinessRouteGate } from '@/lib/use-business-route-gate';
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
import {
  buildPrimaryLocationPhysicalPatch,
  businessLocationStateFromRow,
  findPrimaryBusinessLocation,
} from '@/lib/owner-primary-location';
import { BackofficeSuccessState } from '@qalago/brand/states';
import {
  BackofficeField,
  BackofficeFormActions,
  BackofficeFormSection,
  BackofficeInput,
  BackofficeTextarea,
  useFormDirty,
  useUnsavedChangesGuard,
} from '@qalago/brand/forms';

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
  const {
    allowed: routeAllowed,
    business: gateBusiness,
    businesses: gateBusinesses,
  } = useBusinessRouteGate(BUSINESS_ROUTE_ACCESS.businessProfile, id);
  const [myItems, setMyItems] = useState<MyBusinessItem[]>([]);
  const [location, setLocation] = useState<BusinessLocationState>({ address: '' });
  const [primaryLocationId, setPrimaryLocationId] = useState<string | null>(null);
  const [primaryCitySlug, setPrimaryCitySlug] = useState<string>('uralsk');
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
  const business = businesses.find((b) => b.id === id) ?? gateBusiness ?? null;
  const access = findMyBusinessItem(myItems, id)?.access ?? null;
  const permissions = useMemo(() => resolveProfileEditPermissions(access), [access]);
  const profileSnapshot = useMemo(() => JSON.stringify({ form, location }), [form, location]);
  const { dirty: profileDirty, markClean: markProfileClean } = useFormDirty(profileSnapshot);
  const profileBaselineSet = useRef(false);
  useUnsavedChangesGuard(profileDirty && permissions.canEditProfile);

  useEffect(() => {
    if (!form.title || profileBaselineSet.current) return;
    markProfileClean(profileSnapshot);
    profileBaselineSet.current = true;
  }, [form.title, profileSnapshot, markProfileClean]);

  async function refreshMyBusinesses() {
    if (!token) return;
    const res = await ownerApi.listMyBusinesses(token);
    setMyItems(res.items);
  }

  useEffect(() => {
    if (!token || !routeAllowed) return;
    refreshMyBusinesses().catch((err) => setError(parseApiError(locale, err)));
  }, [token, locale, routeAllowed]);

  useEffect(() => {
    if (!token || !id || !routeAllowed) return;
    (async () => {
      try {
        const [b, locRes] = await Promise.all([
          ownerApi.getBusiness(token, id),
          ownerApi.listBusinessLocations(token, id),
        ]);
        const primary = findPrimaryBusinessLocation(locRes.items);
        if (primary) {
          setPrimaryLocationId(primary.id);
          setLocation(businessLocationStateFromRow(primary));
          const cities = await ownerApi.listCities().catch(() => []);
          const cityRow = cities.find((c) => c.id === primary.cityId);
          setPrimaryCitySlug(cityRow?.slug ?? b.city?.slug ?? 'uralsk');
        } else {
          setPrimaryLocationId(null);
          setLocation({ address: b.address ?? '' });
          setPrimaryCitySlug(b.city?.slug ?? 'uralsk');
        }
        const hours = parseHours(b.workHours);
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
  }, [token, id, locale, routeAllowed]);

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
        includeProfile: true,
        includeHours: false,
      });
      const locationPatch = buildPrimaryLocationPhysicalPatch(location);
      if (Object.keys(payload).length === 0 && !primaryLocationId) return;
      if (Object.keys(payload).length > 0) {
        await ownerApi.updateBusiness(token, id, payload);
      }
      if (primaryLocationId) {
        await ownerApi.updateBusinessLocation(token, id, primaryLocationId, locationPatch);
      }
      setProfileSaved(true);
      markProfileClean(JSON.stringify({ form, location }));
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
      businesses={gateBusinesses.length > 0 ? gateBusinesses : businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {!routeAllowed ? (
        <BusinessSectionAccessDenied />
      ) : (
        <>
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
          {taxonomySaved ? <BackofficeSuccessState message={ui.__9b14e9} /> : null}
        </section>
      )}

      {(permissions.canEditProfile || permissions.canEditHours) && (
        <form
          onSubmit={saveProfileSection}
          className="form-card form-grid"
          style={{ maxWidth: 720, marginBottom: 16 }}
        >
          {profileTextField(ui.text_602680, form.title, (v) => setForm({ ...form, title: v }), readOnlyProfile)}
          {profileTextField(ui.__62b685, form.shortDesc, (v) => setForm({ ...form, shortDesc: v }), readOnlyProfile)}
          {profileTextArea(ui.text_38ca0a, form.description, (v) => setForm({ ...form, description: v }), readOnlyProfile)}

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
              citySlug={primaryCitySlug}
              value={location}
              onChange={setLocation}
              readOnly={readOnlyProfile}
              addressLabel={ui.text_80148f}
            />
          )}
          {profileTextField(ui.text_2928e1, form.phone, (v) => setForm({ ...form, phone: v }), readOnlyProfile, { inputMode: 'tel' })}
          {profileTextField('WhatsApp', form.whatsapp, (v) => setForm({ ...form, whatsapp: v }), readOnlyProfile, { inputMode: 'tel' })}
          {profileTextField('Instagram', form.instagram, (v) => setForm({ ...form, instagram: v }), readOnlyProfile)}
          {profileTextField(ui.text_61dee7, form.website, (v) => setForm({ ...form, website: v }), readOnlyProfile, { type: 'url' })}

          {permissions.canEditProfile && (
            <BackofficeFormActions>
              <button type="submit" className="btn btn-primary" disabled={!profileDirty}>
                {ui.text_74ea58}
              </button>
            </BackofficeFormActions>
          )}
          {profileSaved ? <BackofficeSuccessState message={ui.text_54a59b} /> : null}
        </form>
      )}

      {(permissions.canEditProfile || permissions.canEditHours) && (
        <form onSubmit={saveHoursSection} className="form-card form-grid" style={{ maxWidth: 720 }}>
          <h3 className="form-section-title">{ui.__5e77e4}</h3>
          {profileTextField(ui.__255eae, form.weekdays, (v) => setForm({ ...form, weekdays: v }), readOnlyHours)}
          {profileTextField(ui.text_cee58b, form.saturday, (v) => setForm({ ...form, saturday: v }), readOnlyHours)}
          {profileTextField(ui.text_aa48fa, form.sunday, (v) => setForm({ ...form, sunday: v }), readOnlyHours)}
          {permissions.canEditHours && (
            <BackofficeFormActions>
              <button type="submit" className="btn btn-primary">{ui.text_74ea58}</button>
            </BackofficeFormActions>
          )}
          {hoursSaved ? <BackofficeSuccessState message={ui.text_54a59b} /> : null}
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
        </>
      )}
    </BusinessShell>
  );
}

function profileTextField(
  label: string,
  value: string,
  onChange: (v: string) => void,
  readOnly = false,
  inputProps: ComponentProps<typeof BackofficeInput> = {},
) {
  return (
    <BackofficeField label={label}>
      {({ id, describedBy, invalid }) => (
        <BackofficeInput
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          disabled={readOnly}
          {...inputProps}
        />
      )}
    </BackofficeField>
  );
}

function profileTextArea(
  label: string,
  value: string,
  onChange: (v: string) => void,
  readOnly = false,
) {
  return (
    <BackofficeField label={label}>
      {({ id, describedBy, invalid }) => (
        <BackofficeTextarea
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          readOnly={readOnly}
          disabled={readOnly}
        />
      )}
    </BackofficeField>
  );
}
