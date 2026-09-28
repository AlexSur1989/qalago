'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CatalogLocationsManager } from '@/components/catalog/catalog-locations-manager';
import { useCatalogContext } from '@/components/catalog/catalog-layout-client';
import { adminCatalogApi, type AdminCatalogBusinessDetail } from '@/lib/admin-catalog-api';
import {
  adminCatalogLabel,
  adminCatalogStatusLabel,
} from '@/lib/admin-catalog-labels';
import { parseAdminCatalogApiError } from '@/lib/admin-catalog-errors';
import { buildAdminCatalogPatchPayload } from '@/lib/admin-catalog-form';
import {
  canEditAdminCatalogBusiness,
  canEditCatalogTaxonomy,
} from '@/lib/admin-catalog-rbac';
import { statusClass } from '@/lib/admin-utils';
import { adminApi, type CategoryRow, type SubcategoryAdminRow } from '@/lib/api';

export default function CatalogBusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, user, locale, cities, citySlug } = useCatalogContext();
  const canEdit = canEditAdminCatalogBusiness(user.role);
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
  const [statusBusy, setStatusBusy] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryAdminRow[]>([]);
  const [taxCategoryId, setTaxCategoryId] = useState('');
  const [taxSubIds, setTaxSubIds] = useState<string[]>([]);
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [taxOk, setTaxOk] = useState(false);

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
    if (!canEdit || statusBusy || !detail) return;
    const confirmMsg =
      next === 'BLOCKED'
        ? adminCatalogLabel(locale, 'confirmBlock')
        : next === 'ACTIVE'
          ? adminCatalogLabel(locale, 'confirmActivate')
          : adminCatalogLabel(locale, 'confirmActivate');
    if (!window.confirm(confirmMsg)) return;
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
    if (!canEdit || saving) return;
    setSaveError(null);
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
        <Link href={`/dashboard/businesses/${detail.id}/content`} className="btn btn-ghost btn-sm">
          {adminCatalogLabel(locale, 'linkContent')}
        </Link>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionCore')}</h3>
        <p>
          <span className={statusClass(detail.status)}>
            {adminCatalogStatusLabel(locale, detail.status)}
          </span>
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
          <form onSubmit={onSaveTaxonomy} style={{ maxWidth: 640 }}>
            {taxError && <p className="muted">{taxError}</p>}
            {taxOk && <p className="muted">{adminCatalogLabel(locale, 'taxonomySaved')}</p>}
            <label style={{ display: 'block' }}>
              {adminCatalogLabel(locale, 'fieldCategory')}
              <select
                required
                value={taxCategoryId}
                onChange={(e) => {
                  setTaxCategoryId(e.target.value);
                  setTaxSubIds([]);
                }}
                style={{ width: '100%' }}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'kk' ? c.nameKk : c.nameRu}
                  </option>
                ))}
              </select>
            </label>
            {subsForCategory.length > 0 && (
              <fieldset style={{ marginTop: 12, border: 'none', padding: 0 }}>
                <legend>{adminCatalogLabel(locale, 'fieldSubcategories')}</legend>
                {subsForCategory.map((s) => (
                  <label key={s.id} style={{ display: 'block' }}>
                    <input
                      type="checkbox"
                      checked={taxSubIds.includes(s.id)}
                      onChange={() => toggleTaxSub(s.id)}
                    />{' '}
                    {locale === 'kk' ? s.nameKk : s.nameRu}
                  </label>
                ))}
              </fieldset>
            )}
            <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} disabled={taxSaving}>
              {taxSaving ? adminCatalogLabel(locale, 'saving') : adminCatalogLabel(locale, 'saveTaxonomy')}
            </button>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionLifecycle')}</h3>
        <p>{adminCatalogStatusLabel(locale, detail.status)}</p>
        {canEdit && (
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

      <div style={{ marginTop: 16 }}>
        <CatalogLocationsManager
          token={token}
          businessId={detail.id}
          locale={locale}
          cities={cities}
          canEdit={canEdit}
        />
      </div>

      {canEdit && (
        <form className="card" style={{ marginTop: 16, maxWidth: 720 }} onSubmit={onSaveCatalog}>
          <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionCatalogEdit')}</h3>
          {saveError && <p className="muted">{saveError}</p>}
          <label style={{ display: 'block' }}>
            {adminCatalogLabel(locale, 'fieldTitle')}
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {adminCatalogLabel(locale, 'fieldShortDesc')}
            <textarea value={editShortDesc} onChange={(e) => setEditShortDesc(e.target.value)} rows={2} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {adminCatalogLabel(locale, 'fieldDescription')}
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {adminCatalogLabel(locale, 'fieldPhone')}
            <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {adminCatalogLabel(locale, 'fieldWhatsapp')}
            <input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {adminCatalogLabel(locale, 'fieldInstagram')}
            <input value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {adminCatalogLabel(locale, 'fieldWebsite')}
            <input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {adminCatalogLabel(locale, 'fieldWorkHours')}
            <textarea value={editWorkHoursJson} onChange={(e) => setEditWorkHoursJson(e.target.value)} rows={2} style={{ width: '100%' }} />
          </label>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? adminCatalogLabel(locale, 'saving') : adminCatalogLabel(locale, 'saveCatalog')}
          </button>
        </form>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/catalog/businesses">← {adminCatalogLabel(locale, 'navBusinesses')}</Link>
      </p>
    </section>
  );
}
