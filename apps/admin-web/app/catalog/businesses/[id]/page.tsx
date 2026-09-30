'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CatalogLocationsManager } from '@/components/catalog/catalog-locations-manager';
import { CatalogBusinessTeamPanel } from '@/components/catalog/catalog-business-team-panel';
import { adminBusinessTeamEnabled } from '@/lib/admin-feature-flags';
import { useCatalogContext } from '@/components/catalog/catalog-layout-client';
import { adminCatalogApi, type AdminCatalogBusinessDetail } from '@/lib/admin-catalog-api';
import {
  adminCatalogLabel,
  adminCatalogStatusLabel,
} from '@/lib/admin-catalog-labels';
import { parseAdminCatalogApiError } from '@/lib/admin-catalog-errors';
import { buildAdminCatalogPatchPayload } from '@/lib/admin-catalog-form';
import {
  canChangeBusinessLifecycle,
  canEditBusinessCore,
  canEditCatalogTaxonomy,
} from '@/lib/admin-catalog-rbac';
import { BackofficeBadge } from '@qalago/brand/badges';
import { backofficeConfirm } from '@qalago/brand/confirm';
import { BackofficeErrorState, BackofficeSuccessState } from '@qalago/brand/states';
import {
  BackofficeCheckbox,
  BackofficeField,
  BackofficeFormActions,
  BackofficeFormSection,
  BackofficeInput,
  BackofficeSelect,
  BackofficeTextarea,
} from '@qalago/brand/forms';
import { businessStatusPresentation } from '@qalago/brand/status';
import { adminApi, type CategoryRow, type SubcategoryAdminRow } from '@/lib/api';

export default function CatalogBusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, user, locale, cities, citySlug } = useCatalogContext();
  const canTaxonomy = canEditCatalogTaxonomy(user.role);

  const [detail, setDetail] = useState<AdminCatalogBusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editShortDesc, setEditShortDesc] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editWorkHoursJson, setEditWorkHoursJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryAdminRow[]>([]);
  const [taxCategoryId, setTaxCategoryId] = useState('');
  const [taxSubIds, setTaxSubIds] = useState<string[]>([]);
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [taxOk, setTaxOk] = useState(false);

  const canEditBusinessCoreFields = canEditBusinessCore(
    user.role,
    user.managedCity?.slug,
    detail?.city?.slug,
  );
  const canLifecycle = canChangeBusinessLifecycle(
    user.role,
    user.managedCity?.slug,
    detail?.city?.slug,
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return adminCatalogApi
      .getBusiness(token, params.id)
      .then((d) => {
        setDetail(d);
        setEditTitle(d.title);
        setEditShortDesc(d.shortDesc ?? '');
        setEditDescription(d.description ?? '');
        setEditPhone(d.phone ?? '');
        setEditWhatsapp(d.whatsapp ?? '');
        setEditInstagram(d.instagram ?? '');
        setEditWebsite(d.website ?? '');
        setEditWorkHoursJson(d.workHours ? JSON.stringify(d.workHours) : '');
        setTaxCategoryId(d.category.id);
        setTaxSubIds(d.subcategories.map((s) => s.id));
      })
      .catch((err) => setError(parseAdminCatalogApiError(err, locale).message))
      .finally(() => setLoading(false));
  }, [token, params.id, locale]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canTaxonomy || !token) return;
    adminApi
      .listCategoriesAdmin(token, citySlug)
      .then(setCategories)
      .catch(() => undefined);
  }, [canTaxonomy, token, citySlug]);

  useEffect(() => {
    if (!canTaxonomy || !token || !taxCategoryId) {
      setSubcategories([]);
      return;
    }
    adminApi.listSubcategoriesAdmin(token, taxCategoryId).then(setSubcategories).catch(() => undefined);
  }, [canTaxonomy, token, taxCategoryId]);

  const subsForCategory = subcategories.filter(
    (s) => s.categoryId === taxCategoryId && s.isActive,
  );

  function toggleTaxSub(id: string) {
    setTaxSubIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSaveTaxonomy(e: FormEvent) {
    e.preventDefault();
    if (!canTaxonomy || taxSaving) return;
    setTaxError(null);
    setTaxOk(false);
    setTaxSaving(true);
    try {
      await adminCatalogApi.updateTaxonomy(token, params.id, {
        categoryId: taxCategoryId,
        subcategoryIds: taxSubIds,
      });
      setTaxOk(true);
      await load();
    } catch (err) {
      setTaxError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setTaxSaving(false);
    }
  }

  async function changeStatus(next: 'ACTIVE' | 'BLOCKED' | 'PENDING') {
    if (!canLifecycle || statusBusy || !detail) return;
    const confirmMsg =
      next === 'BLOCKED'
        ? adminCatalogLabel(locale, 'confirmBlock')
        : next === 'ACTIVE'
          ? adminCatalogLabel(locale, 'confirmActivate')
          : adminCatalogLabel(locale, 'confirmActivate');
    const ok = await backofficeConfirm({
      title: next === 'BLOCKED' ? 'Заблокировать заведение?' : 'Изменить статус заведения?',
      description: confirmMsg,
      variant: next === 'BLOCKED' ? 'danger' : 'warning',
      confirmLabel: 'Подтвердить',
    });
    if (!ok) return;
    setStatusBusy(true);
    try {
      await adminCatalogApi.updateStatus(token, params.id, next);
      await load();
    } catch (err) {
      setError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setStatusBusy(false);
    }
  }

  async function onSaveCatalog(e: FormEvent) {
    e.preventDefault();
    if (!canEditBusinessCoreFields || saving) return;
    setSaveError(null);
    setSaveOk(false);
    setSaving(true);
    try {
      let workHours: Record<string, string> | undefined;
      if (editWorkHoursJson.trim()) {
        workHours = JSON.parse(editWorkHoursJson) as Record<string, string>;
      }
      const body = buildAdminCatalogPatchPayload({
        title: editTitle,
        shortDesc: editShortDesc,
        description: editDescription,
        phone: editPhone,
        whatsapp: editWhatsapp,
        instagram: editInstagram,
        website: editWebsite,
        workHours,
      });
      await adminCatalogApi.patchCatalog(token, params.id, body);
      setSaveOk(true);
      await load();
    } catch (err) {
      setSaveError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">{adminCatalogLabel(locale, 'loading')}</p>;
  if (error) return <p className="muted">{error}</p>;
  if (!detail) return null;

  const categoryLabel =
    locale === 'kk' ? detail.category.title : detail.category.title;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0 }}>{detail.title}</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href={`/dashboard/businesses/${detail.id}/content`} className="btn btn-ghost btn-sm">
            {adminCatalogLabel(locale, 'linkContent')}
          </Link>
          {adminBusinessTeamEnabled() && (
            <Link href={`/catalog/businesses/${detail.id}/team`} className="btn btn-ghost btn-sm">
              {adminCatalogLabel(locale, 'linkTeam')}
            </Link>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionCore')}</h3>
        <p>
          <BackofficeBadge
            label={adminCatalogStatusLabel(locale, detail.status)}
            tone={businessStatusPresentation(detail.status).tone}
          />
        </p>
        <p className="muted">
          {adminCatalogLabel(locale, 'slugReadOnly')}: <code>{detail.slug}</code>
        </p>
        <p>
          {detail.ownerId
            ? adminCatalogLabel(locale, 'ownerAttached')
            : adminCatalogLabel(locale, 'noOwner')}
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionTaxonomy')}</h3>
        {!canTaxonomy && (
          <>
            <p>{categoryLabel}</p>
            {detail.subcategories.length > 0 && (
              <ul>
                {detail.subcategories.map((s) => (
                  <li key={s.id}>{locale === 'kk' ? s.nameKk : s.nameRu}</li>
                ))}
              </ul>
            )}
          </>
        )}
        {canTaxonomy && (
          <form onSubmit={onSaveTaxonomy} className="bo-form-grid bo-form-grid--1" style={{ maxWidth: 640 }}>
            {taxError ? <BackofficeErrorState message={taxError} /> : null}
            {taxOk ? <BackofficeSuccessState message={adminCatalogLabel(locale, 'taxonomySaved')} /> : null}
            <BackofficeField label={adminCatalogLabel(locale, 'fieldCategory')} required>
              {({ id, describedBy, invalid }) => (
                <BackofficeSelect
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  required
                  value={taxCategoryId}
                  onChange={(e) => {
                    setTaxCategoryId(e.target.value);
                    setTaxSubIds([]);
                  }}
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {locale === 'kk' ? c.nameKk : c.nameRu}
                    </option>
                  ))}
                </BackofficeSelect>
              )}
            </BackofficeField>
            {subsForCategory.length > 0 && (
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend className="bo-field-label">{adminCatalogLabel(locale, 'fieldSubcategories')}</legend>
                {subsForCategory.map((s) => (
                  <BackofficeCheckbox
                    key={s.id}
                    label={locale === 'kk' ? s.nameKk : s.nameRu}
                    checked={taxSubIds.includes(s.id)}
                    onChange={() => toggleTaxSub(s.id)}
                  />
                ))}
              </fieldset>
            )}
            <BackofficeFormActions>
              <button type="submit" className="btn btn-primary btn-sm" disabled={taxSaving} aria-busy={taxSaving}>
                {taxSaving ? adminCatalogLabel(locale, 'saving') : adminCatalogLabel(locale, 'saveTaxonomy')}
              </button>
            </BackofficeFormActions>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionLifecycle')}</h3>
        <p>{adminCatalogStatusLabel(locale, detail.status)}</p>
        {canLifecycle && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(detail.status === 'PENDING' || detail.status === 'BLOCKED') && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={statusBusy}
                onClick={() => changeStatus('ACTIVE')}
              >
                {adminCatalogLabel(locale, 'actionActivate')}
              </button>
            )}
            {detail.status === 'ACTIVE' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={statusBusy}
                onClick={() => changeStatus('BLOCKED')}
              >
                {adminCatalogLabel(locale, 'actionBlock')}
              </button>
            )}
          </div>
        )}
      </div>

      <CatalogBusinessTeamPanel businessId={detail.id} locale={locale} showRouteLink />

      <div style={{ marginTop: 16 }}>
        <CatalogLocationsManager
          token={token}
          businessId={detail.id}
          locale={locale}
          cities={cities}
          staffSession={{
            role: user.role,
            managedCityId: user.managedCityId,
            managedCity: user.managedCity,
          }}
          businessPrimaryCitySlug={detail.city?.slug}
        />
      </div>

      {canEditBusinessCoreFields && (
        <form className="card bo-form-grid bo-form-grid--1" style={{ marginTop: 16, maxWidth: 720 }} onSubmit={onSaveCatalog}>
          <BackofficeFormSection title={adminCatalogLabel(locale, 'sectionCatalogEdit')}>
            {saveError ? <BackofficeErrorState message={saveError} /> : null}
            {saveOk ? <BackofficeSuccessState message="Изменения сохранены" /> : null}
            <BackofficeField label={adminCatalogLabel(locale, 'fieldTitle')} required>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              )}
            </BackofficeField>
            <BackofficeField label={adminCatalogLabel(locale, 'fieldShortDesc')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeTextarea id={id} aria-describedby={describedBy} invalid={invalid} value={editShortDesc} onChange={(e) => setEditShortDesc(e.target.value)} rows={2} />
              )}
            </BackofficeField>
            <BackofficeField label={adminCatalogLabel(locale, 'fieldDescription')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeTextarea id={id} aria-describedby={describedBy} invalid={invalid} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
              )}
            </BackofficeField>
            <BackofficeField label={adminCatalogLabel(locale, 'fieldPhone')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} inputMode="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              )}
            </BackofficeField>
            <BackofficeField label={adminCatalogLabel(locale, 'fieldWhatsapp')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} inputMode="tel" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} />
              )}
            </BackofficeField>
            <BackofficeField label={adminCatalogLabel(locale, 'fieldInstagram')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} />
              )}
            </BackofficeField>
            <BackofficeField label={adminCatalogLabel(locale, 'fieldWebsite')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} type="url" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} />
              )}
            </BackofficeField>
            <BackofficeField label={adminCatalogLabel(locale, 'fieldWorkHours')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeTextarea id={id} aria-describedby={describedBy} invalid={invalid} value={editWorkHoursJson} onChange={(e) => setEditWorkHoursJson(e.target.value)} rows={2} />
              )}
            </BackofficeField>
            <BackofficeFormActions>
              <button type="submit" className="btn btn-primary" disabled={saving} aria-busy={saving}>
                {saving ? adminCatalogLabel(locale, 'saving') : adminCatalogLabel(locale, 'saveCatalog')}
              </button>
            </BackofficeFormActions>
          </BackofficeFormSection>
        </form>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/catalog/businesses">← {adminCatalogLabel(locale, 'navBusinesses')}</Link>
      </p>
    </section>
  );
}
