'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { adminCatalogApi } from '@/lib/admin-catalog-api';
import type { AdminBusinessLocationRow } from '@/lib/admin-business-locations-api';
import { adminCatalogLabel } from '@/lib/admin-catalog-labels';
import { backofficeConfirm } from '@qalago/brand/confirm';
import type { AdminCatalogLocale } from '@/lib/admin-catalog-labels';
import { parseAdminCatalogApiError } from '@/lib/admin-catalog-errors';
import { buildAdminLocationPayload } from '@/lib/admin-catalog-location-form';
import {
  adminBusinessLocationCityOptions,
  canCreateLocation,
  canDeleteSpecificLocation,
  canEditSpecificLocation,
  canSetSpecificLocationPrimary,
} from '@/lib/admin-catalog-rbac';
import {
  buildAdminCatalogStaffScope,
  type AdminCatalogStaffSession,
} from '@/lib/admin-catalog-staff-scope';
import type { CityRow } from '@/lib/api';
import {
  BackofficeEmptyState,
  BackofficeErrorState,
  BackofficeLoadingState,
  BackofficeSuccessState,
} from '@qalago/brand/states';
import {
  BackofficeField,
  BackofficeFieldGroup,
  BackofficeFormActions,
  BackofficeFormSection,
  BackofficeInput,
  BackofficeSelect,
  BackofficeTextarea,
} from '@qalago/brand/forms';
import { BackofficeBranchCard } from '@qalago/brand/locations';

type Props = {
  token: string;
  businessId: string;
  locale: AdminCatalogLocale;
  cities: CityRow[];
  staffSession: AdminCatalogStaffSession;
  businessPrimaryCitySlug?: string | null;
};

type FormMode = 'closed' | 'add' | 'edit';

const emptyForm = () => ({
  cityId: '',
  address: '',
  latitude: '',
  longitude: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  website: '',
  workHoursJson: '',
});

export function CatalogLocationsManager({
  token,
  businessId,
  locale,
  cities,
  staffSession,
  businessPrimaryCitySlug,
}: Props) {
  const [items, setItems] = useState<AdminBusinessLocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<FormMode>('closed');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const staffScope = useMemo(
    () => buildAdminCatalogStaffScope(staffSession, cities),
    [staffSession, cities],
  );

  const selectableCities = useMemo(
    () => adminBusinessLocationCityOptions(staffSession.role, cities, staffScope.managedCityIds),
    [staffSession.role, cities, staffScope.managedCityIds],
  );

  const canAdd = canCreateLocation(staffSession.role, staffScope.managedCityIds);
  const cityLockedInForm = mode === 'edit' && selectableCities.length <= 1;

  const cityName = (cityId: string) => {
    const c = cities.find((x) => x.id === cityId);
    if (!c) return cityId;
    return locale === 'kk' && c.nameKk ? c.nameKk : c.nameRu;
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return adminCatalogApi
      .listLocations(token, businessId)
      .then((res) => setItems(res.items))
      .catch((err) => setError(parseAdminCatalogApiError(err, locale).message))
      .finally(() => setLoading(false));
  }, [token, businessId, locale]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    const defaultCityId = selectableCities.length === 1 ? selectableCities[0].id : '';
    setForm({ ...emptyForm(), cityId: defaultCityId });
    setEditId(null);
    setSuccess(null);
    setMode('add');
  }

  function openEdit(loc: AdminBusinessLocationRow) {
    if (!canEditSpecificLocation(staffSession.role, loc, staffScope, businessPrimaryCitySlug)) {
      return;
    }
    setEditId(loc.id);
    setSuccess(null);
    setForm({
      cityId: loc.cityId,
      address: loc.address,
      latitude: loc.latitude != null ? String(loc.latitude) : '',
      longitude: loc.longitude != null ? String(loc.longitude) : '',
      phone: loc.phone ?? '',
      whatsapp: loc.whatsapp ?? '',
      instagram: loc.instagram ?? '',
      website: loc.website ?? '',
      workHoursJson: loc.workHours ? JSON.stringify(loc.workHours) : '',
    });
    setMode('edit');
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      let workHours: Record<string, string> | undefined;
      if (form.workHoursJson.trim()) {
        workHours = JSON.parse(form.workHoursJson) as Record<string, string>;
      }
      const lat = form.latitude.trim() ? Number(form.latitude) : undefined;
      const lng = form.longitude.trim() ? Number(form.longitude) : undefined;
      const payload = buildAdminLocationPayload({
        cityId: form.cityId,
        address: form.address,
        latitude: lat,
        longitude: lng,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        instagram: form.instagram || undefined,
        website: form.website || undefined,
        workHours,
      });
      if (mode === 'add') {
        await adminCatalogApi.createLocation(token, businessId, payload);
      } else if (mode === 'edit' && editId) {
        await adminCatalogApi.updateLocation(token, businessId, editId, payload);
      }
      setMode('closed');
      setSuccess(adminCatalogLabel(locale, 'locationSaved'));
      await load();
    } catch (err) {
      setError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setBusy(false);
    }
  }

  async function makePrimary(loc: AdminBusinessLocationRow) {
    const ok = await backofficeConfirm({
      title: adminCatalogLabel(locale, 'confirmSetPrimaryTitle'),
      description: `${cityName(loc.cityId)}, ${loc.address}`,
      consequence: adminCatalogLabel(locale, 'confirmSetPrimaryConsequence'),
      variant: 'warning',
      confirmLabel: adminCatalogLabel(locale, 'makePrimary'),
    });
    if (!ok) return;
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await adminCatalogApi.setPrimaryLocation(token, businessId, loc.id);
      setSuccess(adminCatalogLabel(locale, 'locationSaved'));
      await load();
    } catch (err) {
      setError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeLocation(locationId: string) {
    const ok = await backofficeConfirm({
      title: 'Удалить филиал?',
      description: adminCatalogLabel(locale, 'confirmDeleteLocation'),
      consequence: 'Это действие нельзя отменить.',
      variant: 'danger',
      confirmLabel: 'Удалить',
    });
    if (!ok) return;
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await adminCatalogApi.deleteLocation(token, businessId, locationId);
      await load();
    } catch (err) {
      setError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionLocations')}</h3>
        {canAdd && selectableCities.length > 0 && mode === 'closed' && (
          <button type="button" className="btn btn-sm btn-primary" onClick={openAdd} disabled={busy}>
            {adminCatalogLabel(locale, 'addLocation')}
          </button>
        )}
      </div>

      <p className="muted" style={{ fontSize: '0.875rem' }}>
        {adminCatalogLabel(locale, 'primaryBranchHint')}
      </p>

      {error ? <BackofficeErrorState message={error} onRetry={() => void load()} /> : null}
      {success ? <BackofficeSuccessState message={success} /> : null}

      {loading ? (
        <BackofficeLoadingState label={adminCatalogLabel(locale, 'loading')} density="section" />
      ) : null}

      {!loading && items.length === 0 && (
        <BackofficeEmptyState
          title={adminCatalogLabel(locale, 'locationsEmpty')}
          icon="location"
          density="section"
          actions={
            canAdd && selectableCities.length > 0 ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={openAdd} disabled={busy}>
                {adminCatalogLabel(locale, 'addLocation')}
              </button>
            ) : undefined
          }
        />
      )}

      {!loading && items.length > 0 && (
        <ul className="bo-branch-list">
          {items.map((loc) => {
            const showEdit = canEditSpecificLocation(
              staffSession.role,
              loc,
              staffScope,
              businessPrimaryCitySlug,
            );
            const showSetPrimary =
              !loc.isPrimary &&
              canSetSpecificLocationPrimary(
                staffSession.role,
                loc.cityId,
                staffScope,
                businessPrimaryCitySlug,
              );
            const showDelete =
              !loc.isPrimary &&
              canDeleteSpecificLocation(staffSession.role, loc.cityId, staffScope.managedCityIds);

            return (
              <li key={loc.id}>
                <BackofficeBranchCard
                  cityLabel={cityName(loc.cityId)}
                  address={loc.address}
                  isPrimary={loc.isPrimary}
                  primaryBadgeLabel={adminCatalogLabel(locale, 'primaryBadge')}
                  phone={loc.phone}
                  hoursSummary={loc.workHours?.mon ?? null}
                  hoursSummaryLabel={adminCatalogLabel(locale, 'fieldWorkHours')}
                  actions={
                    showEdit || showSetPrimary || showDelete ? (
                      <>
                        {showEdit && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEdit(loc)}
                            disabled={busy}
                          >
                            {adminCatalogLabel(locale, 'editLocation')}
                          </button>
                        )}
                        {showSetPrimary && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => void makePrimary(loc)}
                            disabled={busy}
                          >
                            {adminCatalogLabel(locale, 'makePrimary')}
                          </button>
                        )}
                        {showDelete && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => void removeLocation(loc.id)}
                            disabled={busy}
                          >
                            {adminCatalogLabel(locale, 'deleteLocation')}
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

      {canAdd && mode !== 'closed' && selectableCities.length > 0 && (
        <form onSubmit={submitForm} className="bo-form-grid bo-form-grid--1" style={{ marginTop: 16, maxWidth: 720 }}>
          <BackofficeFormSection
            title={mode === 'add' ? adminCatalogLabel(locale, 'addLocation') : adminCatalogLabel(locale, 'editLocation')}
          >
            <BackofficeFormSection title={adminCatalogLabel(locale, 'sectionLocationMain')}>
              <BackofficeField
                label={adminCatalogLabel(locale, 'fieldCity')}
                required
                helperText={cityLockedInForm ? adminCatalogLabel(locale, 'cityLockedHint') : undefined}
              >
                {({ id, describedBy, invalid }) => (
                  <BackofficeSelect
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    required
                    value={form.cityId}
                    onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
                    disabled={cityLockedInForm || busy}
                  >
                    <option value="">—</option>
                    {selectableCities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {locale === 'kk' && c.nameKk ? c.nameKk : c.nameRu}
                      </option>
                    ))}
                  </BackofficeSelect>
                )}
              </BackofficeField>
              <BackofficeField label={adminCatalogLabel(locale, 'fieldAddress')} required>
                {({ id, describedBy, invalid }) => (
                  <BackofficeInput
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    required
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    disabled={busy}
                  />
                )}
              </BackofficeField>
            </BackofficeFormSection>

            <BackofficeFormSection title={adminCatalogLabel(locale, 'sectionLocationCoords')}>
              <BackofficeFieldGroup columns="inline">
                <BackofficeField label={adminCatalogLabel(locale, 'fieldLat')}>
                  {({ id, describedBy, invalid }) => (
                    <BackofficeInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      inputMode="decimal"
                      value={form.latitude}
                      onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                      disabled={busy}
                    />
                  )}
                </BackofficeField>
                <BackofficeField label={adminCatalogLabel(locale, 'fieldLng')}>
                  {({ id, describedBy, invalid }) => (
                    <BackofficeInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      inputMode="decimal"
                      value={form.longitude}
                      onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                      disabled={busy}
                    />
                  )}
                </BackofficeField>
              </BackofficeFieldGroup>
            </BackofficeFormSection>

            <BackofficeFormSection title={adminCatalogLabel(locale, 'sectionLocationContacts')}>
              <BackofficeField label={adminCatalogLabel(locale, 'fieldPhone')}>
                {({ id, describedBy, invalid }) => (
                  <BackofficeInput
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    disabled={busy}
                  />
                )}
              </BackofficeField>
              <BackofficeField label={adminCatalogLabel(locale, 'fieldWhatsapp')}>
                {({ id, describedBy, invalid }) => (
                  <BackofficeInput
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    inputMode="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    disabled={busy}
                  />
                )}
              </BackofficeField>
              <BackofficeField label={adminCatalogLabel(locale, 'fieldInstagram')}>
                {({ id, describedBy, invalid }) => (
                  <BackofficeInput
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    value={form.instagram}
                    onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                    disabled={busy}
                  />
                )}
              </BackofficeField>
              <BackofficeField label={adminCatalogLabel(locale, 'fieldWebsite')}>
                {({ id, describedBy, invalid }) => (
                  <BackofficeInput
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    disabled={busy}
                  />
                )}
              </BackofficeField>
              <BackofficeField label={adminCatalogLabel(locale, 'fieldWorkHours')}>
                {({ id, describedBy, invalid }) => (
                  <BackofficeTextarea
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    value={form.workHoursJson}
                    onChange={(e) => setForm((f) => ({ ...f, workHoursJson: e.target.value }))}
                    rows={2}
                    disabled={busy}
                  />
                )}
              </BackofficeField>
            </BackofficeFormSection>

            <BackofficeFormActions>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy} aria-busy={busy}>
                {busy ? adminCatalogLabel(locale, 'saving') : adminCatalogLabel(locale, 'saveCatalog')}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('closed')} disabled={busy}>
                {adminCatalogLabel(locale, 'cancel')}
              </button>
            </BackofficeFormActions>
          </BackofficeFormSection>
        </form>
      )}
    </div>
  );
}
