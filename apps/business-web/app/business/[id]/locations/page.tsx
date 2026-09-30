'use client';

import { BusinessLocationField, type BusinessLocationState } from '@/components/business-location/business-location-field';
import { BusinessShell } from '@/components/business-shell';
import { useLocale, useUi } from '@/components/locale-provider';
import { BusinessPermission, hasPermission } from '@/lib/business-access';
import {
  BusinessLocationRow,
  CityRow,
  ownerApi,
} from '@/lib/api';
import { cityDisplayName } from '@/lib/localized-content';
import { branchManagementCopy, buildCreateBusinessLocationPayload } from '@/lib/presentation';
import { parseApiError } from '@/lib/monetization-utils';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { backofficeConfirm } from '@qalago/brand/confirm';
import {
  BackofficeEmptyState,
  BackofficeErrorState,
  BackofficeLoadingState,
  BackofficeSuccessState,
} from '@qalago/brand/states';
import {
  BackofficeField,
  BackofficeFormActions,
  BackofficeFormSection,
  BackofficeInput,
  BackofficeSelect,
} from '@qalago/brand/forms';
import { BackofficeBranchCard, BackofficeLocationHoursGroup } from '@qalago/brand/locations';
import { BUSINESS_ROUTE_ACCESS, useBusinessRouteGate } from '@/lib/use-business-route-gate';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function parseHours(raw: BusinessLocationRow['workHours']) {
  const weekdays = raw?.mon ?? raw?.tue ?? '09:00-22:00';
  return {
    weekdays,
    saturday: raw?.sat ?? weekdays,
    sunday: raw?.sun ?? weekdays,
  };
}

function workHoursFromForm(weekdays: string, saturday: string, sunday: string) {
  return {
    mon: weekdays,
    tue: weekdays,
    wed: weekdays,
    thu: weekdays,
    fri: weekdays,
    sat: saturday,
    sun: sunday,
  };
}

export default function BusinessLocationsPage() {
  const locale = useLocale();
  const ui = useUi();
  const copy = branchManagementCopy(locale);
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const {
    token,
    user,
    ready,
    logout,
    business: selectedBusiness,
    access,
    businesses,
    refreshBusinesses,
    allowed: routeAllowed,
  } = useBusinessRouteGate(BUSINESS_ROUTE_ACCESS.businessProfile, businessId);

  const [locations, setLocations] = useState<BusinessLocationRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cityId, setCityId] = useState('');
  const [location, setLocation] = useState<BusinessLocationState>({ address: '' });
  const [contacts, setContacts] = useState({
    phone: '',
    whatsapp: '',
    instagram: '',
    website: '',
  });
  const [hours, setHours] = useState({
    weekdays: '09:00-22:00',
    saturday: '09:00-22:00',
    sunday: '09:00-22:00',
  });

  const canEditProfile = hasPermission(access, BusinessPermission.BUSINESS_PROFILE_EDIT);
  const canEditHours = hasPermission(access, BusinessPermission.BUSINESS_HOURS_EDIT);
  const canManage = canEditProfile;

  const shellBusiness = businesses.find((b) => b.id === businessId) ?? null;

  const selectedCity = cities.find((c) => c.id === cityId);
  const citySlug = selectedCity?.slug ?? selectedBusiness?.city?.slug ?? 'uralsk';

  const loadLocations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ownerApi.listBusinessLocations(token, businessId);
      setLocations(res.items);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setLoading(false);
    }
  }, [token, businessId, locale]);

  useEffect(() => {
    if (!token || !routeAllowed) return;
    ownerApi.listCities().then(setCities).catch(() => undefined);
    loadLocations();
  }, [token, routeAllowed, loadLocations]);

  function resetForm() {
    setMode('list');
    setEditingId(null);
    setCityId('');
    setLocation({ address: '' });
    setContacts({ phone: '', whatsapp: '', instagram: '', website: '' });
    setHours({ weekdays: '09:00-22:00', saturday: '09:00-22:00', sunday: '09:00-22:00' });
  }

  function startCreate() {
    setMode('create');
    setEditingId(null);
    setCityId(
      selectedBusiness?.city?.slug
        ? cities.find((c) => c.slug === selectedBusiness.city?.slug)?.id ?? ''
        : '',
    );
    setLocation({ address: '' });
    setContacts({ phone: '', whatsapp: '', instagram: '', website: '' });
    setHours({ weekdays: '09:00-22:00', saturday: '09:00-22:00', sunday: '09:00-22:00' });
  }

  function startEdit(row: BusinessLocationRow) {
    setMode('edit');
    setEditingId(row.id);
    setCityId(row.cityId);
    const h = parseHours(row.workHours);
    setLocation({
      address: row.address,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      locationSource:
        row.locationSource === 'MANUALLY_ADJUSTED' ? 'MANUALLY_ADJUSTED' : 'GEOCODED',
    });
    setContacts({
      phone: row.phone ?? '',
      whatsapp: row.whatsapp ?? '',
      instagram: row.instagram ?? '',
      website: row.website ?? '',
    });
    setHours(h);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !canManage) return;
    setMutating(true);
    setError(null);
    setSuccess(null);
    try {
      const workHours = canEditHours
        ? workHoursFromForm(hours.weekdays, hours.saturday, hours.sunday)
        : undefined;
      if (mode === 'create') {
        const payload = buildCreateBusinessLocationPayload({
          cityId,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          locationSource: location.locationSource,
          workHours,
          ...contacts,
        });
        await ownerApi.createBusinessLocation(token, businessId, payload);
        setSuccess(copy.created);
      } else if (mode === 'edit' && editingId) {
        const patch: Record<string, unknown> = {};
        if (canEditProfile) {
          patch.cityId = cityId;
          patch.address = location.address;
          if (location.latitude != null && location.longitude != null) {
            patch.latitude = location.latitude;
            patch.longitude = location.longitude;
            patch.locationSource = location.locationSource ?? 'GEOCODED';
          }
          patch.phone = contacts.phone || null;
          patch.whatsapp = contacts.whatsapp || null;
          patch.instagram = contacts.instagram || null;
          patch.website = contacts.website || null;
        }
        if (canEditHours && workHours) patch.workHours = workHours;
        await ownerApi.updateBusinessLocation(token, businessId, editingId, patch);
        setSuccess(copy.saved);
        const editedPrimary = locations.find((l) => l.id === editingId)?.isPrimary;
        if (editedPrimary) await refreshBusinesses();
      }
      resetForm();
      await loadLocations();
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setMutating(false);
    }
  }

  async function handleSetPrimary(row: BusinessLocationRow) {
    if (!token || !canManage || row.isPrimary) return;
    const city = cities.find((c) => c.id === row.cityId);
    const cityName = city ? cityDisplayName(city, locale) : row.cityId;
    const ok = await backofficeConfirm({
      title: copy.setPrimaryConfirmTitle,
      description: `${cityName}, ${row.address}`,
      consequence: ui.confirmSetPrimaryConsequence,
      variant: 'warning',
      confirmLabel: ui.confirmSetPrimaryActionLabel,
    });
    if (!ok) return;
    setMutating(true);
    setError(null);
    setSuccess(null);
    try {
      await ownerApi.setPrimaryBusinessLocation(token, businessId, row.id);
      setSuccess(copy.primarySwitched);
      await loadLocations();
      await refreshBusinesses();
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setMutating(false);
    }
  }

  if (!ready || !token) {
    return <p className="page-content">{ui.text_89d69a}</p>;
  }

  return (
    <BusinessShell
      activeNav="locations"
      business={shellBusiness}
      businesses={businesses}
      userName={user?.name ?? undefined}
      onLogout={logout}
    >
      {!routeAllowed ? (
        <BusinessSectionAccessDenied />
      ) : (
      <div className="card stack">
        <header>
          <h1>{copy.pageTitle}</h1>
          <p className="muted">{copy.pageIntro}</p>
        </header>

        {error ? <BackofficeErrorState message={error} /> : null}
        {success ? <BackofficeSuccessState message={success} /> : null}

        {!canManage && <p className="muted">{copy.readOnlyHint}</p>}

        {mode === 'list' && (
          <>
            {canManage && (
              <button type="button" className="btn primary" onClick={startCreate} disabled={mutating}>
                {copy.addBranch}
              </button>
            )}
            {loading ? (
              <BackofficeLoadingState label={ui.text_89d69a} density="section" />
            ) : locations.length === 0 ? (
              <BackofficeEmptyState
                title={canManage ? copy.emptyNoBranches : copy.emptyList}
                icon="location"
                density="section"
                actions={
                  canManage ? (
                    <button type="button" className="btn btn-primary" onClick={startCreate} disabled={mutating}>
                      {copy.addBranch}
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="bo-branch-list">
                {locations.map((row) => {
                  const city = cities.find((c) => c.id === row.cityId);
                  const cityName = city ? cityDisplayName(city, locale) : row.cityId;
                  const contactParts = [row.whatsapp, row.instagram, row.website].filter(Boolean);
                  return (
                    <li key={row.id}>
                      <BackofficeBranchCard
                        cityLabel={cityName}
                        address={row.address}
                        isPrimary={row.isPrimary}
                        primaryBadgeLabel={copy.primaryBadge}
                        phone={row.phone}
                        hoursSummary={row.workHours?.mon ?? null}
                        hoursSummaryLabel={copy.hoursSummary}
                        secondaryHint={!row.isPrimary ? copy.secondaryHint : null}
                        contactLine={contactParts.length ? contactParts.join(' · ') : null}
                        actions={
                          canManage ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => startEdit(row)}
                                disabled={mutating}
                              >
                                {copy.editBranch}
                              </button>
                              {!row.isPrimary && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleSetPrimary(row)}
                                  disabled={mutating}
                                >
                                  {copy.setPrimary}
                                </button>
                              )}
                            </>
                          ) : undefined
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {(mode === 'create' || mode === 'edit') && canManage && token && (
          <form className="bo-form-grid bo-form-grid--1" onSubmit={onSubmit}>
            <BackofficeFormSection
              title={mode === 'create' ? copy.createTitle : copy.editTitle}
              description={copy.pageIntro}
            >
              <BackofficeFormSection title={copy.sectionMainInfo}>
                <BackofficeField label={copy.cityLabel} required>
                  {({ id, describedBy, invalid }) => (
                    <BackofficeSelect
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                      required
                      disabled={!canEditProfile || mutating}
                    >
                      <option value="">—</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {cityDisplayName(c, locale)}
                        </option>
                      ))}
                    </BackofficeSelect>
                  )}
                </BackofficeField>
                {canEditProfile && cityId ? (
                  <BusinessLocationField
                    locale={locale}
                    token={token}
                    citySlug={citySlug}
                    value={location}
                    onChange={setLocation}
                    addressLabel={ui.text_80148f}
                  />
                ) : null}
              </BackofficeFormSection>

              {canEditProfile && (
                <BackofficeFormSection title={copy.sectionContacts}>
                <BackofficeField label={ui.text_2928e1}>
                  {({ id, describedBy, invalid }) => (
                    <BackofficeInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      inputMode="tel"
                      value={contacts.phone}
                      onChange={(e) => setContacts((p) => ({ ...p, phone: e.target.value }))}
                      disabled={mutating}
                    />
                  )}
                </BackofficeField>
                <BackofficeField label="WhatsApp">
                  {({ id, describedBy, invalid }) => (
                    <BackofficeInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      inputMode="tel"
                      value={contacts.whatsapp}
                      onChange={(e) => setContacts((p) => ({ ...p, whatsapp: e.target.value }))}
                      disabled={mutating}
                    />
                  )}
                </BackofficeField>
                <BackofficeField label="Instagram">
                  {({ id, describedBy, invalid }) => (
                    <BackofficeInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={contacts.instagram}
                      onChange={(e) => setContacts((p) => ({ ...p, instagram: e.target.value }))}
                      disabled={mutating}
                    />
                  )}
                </BackofficeField>
                <BackofficeField label="Website">
                  {({ id, describedBy, invalid }) => (
                    <BackofficeInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      type="url"
                      value={contacts.website}
                      onChange={(e) => setContacts((p) => ({ ...p, website: e.target.value }))}
                      disabled={mutating}
                    />
                  )}
                </BackofficeField>
                </BackofficeFormSection>
              )}

              {canEditHours && (
                <BackofficeFormSection
                  title={copy.sectionHours}
                  description={copy.sectionHoursBusinessNote}
                >
                  <BackofficeLocationHoursGroup
                    rows={[
                      {
                        id: 'weekdays',
                        label: ui.__255eae,
                        control: (
                          <BackofficeInput
                            value={hours.weekdays}
                            onChange={(e) => setHours((p) => ({ ...p, weekdays: e.target.value }))}
                            disabled={mutating}
                            aria-label={ui.__255eae}
                          />
                        ),
                      },
                      {
                        id: 'saturday',
                        label: ui.text_cee58b,
                        control: (
                          <BackofficeInput
                            value={hours.saturday}
                            onChange={(e) => setHours((p) => ({ ...p, saturday: e.target.value }))}
                            disabled={mutating}
                            aria-label={ui.text_cee58b}
                          />
                        ),
                      },
                      {
                        id: 'sunday',
                        label: ui.text_aa48fa,
                        control: (
                          <BackofficeInput
                            value={hours.sunday}
                            onChange={(e) => setHours((p) => ({ ...p, sunday: e.target.value }))}
                            disabled={mutating}
                            aria-label={ui.text_aa48fa}
                          />
                        ),
                      },
                    ]}
                  />
                </BackofficeFormSection>
              )}

              {mode === 'edit' && editingId ? (
                <BackofficeFormSection title={copy.sectionPrimary}>
                  <div
                    className={`bo-location-primary-status${
                      locations.find((l) => l.id === editingId)?.isPrimary ? '' : ' bo-location-primary-status--secondary'
                    }`}
                  >
                    <p style={{ margin: 0 }}>
                      {locations.find((l) => l.id === editingId)?.isPrimary
                        ? copy.primaryStatusPrimary
                        : copy.primaryStatusSecondary}
                    </p>
                  </div>
                </BackofficeFormSection>
              ) : null}

              <BackofficeFormActions>
                <button type="submit" className="btn btn-primary" disabled={mutating} aria-busy={mutating}>
                  {copy.save}
                </button>
                <button type="button" className="btn btn-ghost" onClick={resetForm} disabled={mutating}>
                  {ui.text_cancel}
                </button>
              </BackofficeFormActions>
            </BackofficeFormSection>
          </form>
        )}
      </div>
      )}
    </BusinessShell>
  );
}
