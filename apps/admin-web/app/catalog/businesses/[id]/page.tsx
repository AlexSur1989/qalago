'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CatalogLocationsReadonly } from '@/components/catalog/catalog-locations-readonly';
import { useCatalogContext } from '@/components/catalog/catalog-layout-client';
import { adminCatalogApi, type AdminCatalogBusinessDetail } from '@/lib/admin-catalog-api';
import {
  adminCatalogLabel,
  adminCatalogStatusLabel,
} from '@/lib/admin-catalog-labels';
import { parseAdminCatalogApiError } from '@/lib/admin-catalog-errors';
import { buildAdminCatalogPatchPayload } from '@/lib/admin-catalog-form';
import { canEditAdminCatalogBusiness } from '@/lib/admin-catalog-rbac';
import { statusClass } from '@/lib/admin-utils';

export default function CatalogBusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, user, locale, cities } = useCatalogContext();
  const canEdit = canEditAdminCatalogBusiness(user.role);

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
      })
      .catch((err) => setError(parseAdminCatalogApiError(err, locale).message))
      .finally(() => setLoading(false));
  }, [token, params.id, locale]);

  useEffect(() => {
    load();
  }, [load]);

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
        <p>{categoryLabel}</p>
        {detail.subcategories.length > 0 && (
          <ul>
            {detail.subcategories.map((s) => (
              <li key={s.id}>{locale === 'kk' ? s.nameKk : s.nameRu}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionLifecycle')}</h3>
        <p>{adminCatalogStatusLabel(locale, detail.status)}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <CatalogLocationsReadonly
          token={token}
          businessId={detail.id}
          locale={locale}
          cities={cities}
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
