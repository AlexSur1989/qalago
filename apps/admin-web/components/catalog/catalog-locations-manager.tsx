'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { adminCatalogApi } from '@/lib/admin-catalog-api';
import type { AdminBusinessLocationRow } from '@/lib/admin-business-locations-api';
import { adminCatalogLabel } from '@/lib/admin-catalog-labels';
import type { AdminCatalogLocale } from '@/lib/admin-catalog-labels';
import { parseAdminCatalogApiError } from '@/lib/admin-catalog-errors';
import { buildAdminLocationPayload } from '@/lib/admin-catalog-location-form';
import {
  adminBusinessLocationCityOptions,
  canAdminAddBusinessLocation,
  canAdminDeleteBusinessLocation,
  canAdminEditBusinessLocation,
  canAdminSetPrimaryBusinessLocation,
} from '@/lib/admin-catalog-rbac';
import type { CityRow } from '@/lib/api';

type Props = {
  token: string;
  businessId: string;
  locale: AdminCatalogLocale;
  cities: CityRow[];
  role: string;
  managedCityId?: string | null;
  managedCitySlug?: string | null;
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
  role,
  managedCityId,
  managedCitySlug,
  businessPrimaryCitySlug,
}: Props) {
  const [items, setItems] = useState<AdminBusinessLocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<FormMode>('closed');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const rbacCtx = useMemo(
    () => ({ managedCityId, managedCitySlug, businessPrimaryCitySlug }),
    [managedCityId, managedCitySlug, businessPrimaryCitySlug],
  );

  const selectableCities = useMemo(
    () => adminBusinessLocationCityOptions(role, cities, managedCityId ?? null),
    [role, cities, managedCityId],
  );

  const canAdd = canAdminAddBusinessLocation(role);

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
    setMode('add');
  }

  function openEdit(loc: AdminBusinessLocationRow) {
    if (!canAdminEditBusinessLocation(role, loc, rbacCtx)) {
      return;
    }
    setEditId(loc.id);
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
      await load();
    } catch (err) {
      setError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setBusy(false);
    }
  }

  async function makePrimary(locationId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminCatalogApi.setPrimaryLocation(token, businessId, locationId);
      await load();
    } catch (err) {
      setError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeLocation(locationId: string) {
    if (!window.confirm(adminCatalogLabel(locale, 'confirmDeleteLocation'))) return;
    if (busy) return;
    setBusy(true);
    setError(null);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionLocations')}</h3>
        {canAdd && selectableCities.length > 0 && (
          <button type="button" className="btn btn-sm btn-primary" onClick={openAdd} disabled={busy}>
            {adminCatalogLabel(locale, 'addLocation')}
          </button>
        )}
      </div>

      {loading && <p className="muted">{adminCatalogLabel(locale, 'loading')}</p>}
      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}

      {!loading && items.length === 0 && <p className="muted">—</p>}

      {!loading && items.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
          {items.map((loc) => {
            const showEdit = canAdminEditBusinessLocation(role, loc, rbacCtx);
            const showSetPrimary =
              !loc.isPrimary &&
              canAdminSetPrimaryBusinessLocation(role, loc.cityId, rbacCtx);
            const showDelete =
              !loc.isPrimary &&
              canAdminDeleteBusinessLocation(role, loc.cityId, managedCityId ?? null);

            return (
              <li
                key={loc.id}
                style={{
                  borderBottom: '1px solid var(--border, #eee)',
                  padding: '12px 0',
                }}
              >
                {loc.isPrimary && (
                  <span className="tag tag-success">{adminCatalogLabel(locale, 'primaryBadge')}</span>
                )}{' '}
                <strong>{loc.address}</strong>
                <span className="muted"> · {cityName(loc.cityId)}</span>
                {(showEdit || showSetPrimary || showDelete) && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {showEdit && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
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
                        onClick={() => makePrimary(loc.id)}
                        disabled={busy}
                      >
                        {adminCatalogLabel(locale, 'makePrimary')}
                      </button>
                    )}
                    {showDelete && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeLocation(loc.id)}
                        disabled={busy}
                      >
                        {adminCatalogLabel(locale, 'deleteLocation')}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canAdd && mode !== 'closed' && selectableCities.length > 0 && (
        <form onSubmit={submitForm} style={{ marginTop: 16, maxWidth: 640 }}>
          <label style={{ display: 'block' }}>
            {adminCatalogLabel(locale, 'fieldCity')}
            <select
              required
              value={form.cityId}
              onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
              style={{ width: '100%' }}
              disabled={mode === 'edit' && selectableCities.length <= 1}
            >
              <option value="">—</option>
              {selectableCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'kk' && c.nameKk ? c.nameKk : c.nameRu}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', marginTop: 8 }}>
            {adminCatalogLabel(locale, 'fieldAddress')}
            <input
              required
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              style={{ width: '100%' }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <label>
              {adminCatalogLabel(locale, 'fieldLat')}
              <input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} />
            </label>
            <label>
              {adminCatalogLabel(locale, 'fieldLng')}
              <input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} />
            </label>
          </div>
          <label style={{ display: 'block', marginTop: 8 }}>
            {adminCatalogLabel(locale, 'fieldPhone')}
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 8 }}>
            {adminCatalogLabel(locale, 'fieldWorkHours')}
            <textarea
              value={form.workHoursJson}
              onChange={(e) => setForm((f) => ({ ...f, workHoursJson: e.target.value }))}
              rows={2}
              style={{ width: '100%' }}
            />
          </label>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? adminCatalogLabel(locale, 'saving') : adminCatalogLabel(locale, 'saveCatalog')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('closed')} disabled={busy}>
              {adminCatalogLabel(locale, 'cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
