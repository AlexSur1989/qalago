'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCatalogContext } from '@/components/catalog/catalog-layout-client';
import { adminApi, type CategoryRow, type SubcategoryAdminRow } from '@/lib/api';
import { adminCatalogApi } from '@/lib/admin-catalog-api';
import { adminCatalogLabel } from '@/lib/admin-catalog-labels';
import { parseAdminCatalogApiError } from '@/lib/admin-catalog-errors';
import { buildAdminCreateBusinessPayload } from '@/lib/admin-catalog-form';
import { canCreateAdminCatalogBusiness } from '@/lib/admin-catalog-rbac';

function parseWorkHours(raw: string): Record<string, string> | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = JSON.parse(trimmed) as Record<string, string>;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('invalid workHours json');
  }
  return parsed;
}

export default function CatalogBusinessCreatePage() {
  const router = useRouter();
  const { token, user, locale } = useCatalogContext();
  const canCreate = canCreateAdminCatalogBusiness(user.role);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [citiesAdmin, setCitiesAdmin] = useState<{ id: string; slug: string; nameRu: string; nameKk?: string | null }[]>(
    [],
  );
  const [subcategories, setSubcategories] = useState<SubcategoryAdminRow[]>([]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]);
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [workHoursJson, setWorkHoursJson] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canCreate) return;
    adminApi.listCategoriesAdmin(token, 'uralsk').then(setCategories).catch(() => undefined);
    adminApi.listCitiesAdmin(token).then(setCitiesAdmin).catch(() => undefined);
  }, [token, canCreate]);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryIds([]);
      return;
    }
    adminApi.listSubcategoriesAdmin(token, categoryId).then((rows) => {
      setSubcategories(rows);
      setSubcategoryIds((prev) => prev.filter((id) => rows.some((s) => s.id === id)));
    }).catch(() => undefined);
  }, [token, categoryId]);

  const subsForCategory = useMemo(
    () => subcategories.filter((s) => s.categoryId === categoryId && s.isActive),
    [subcategories, categoryId],
  );

  if (!canCreate) {
    return <p className="muted">{parseAdminCatalogApiError(new Error('403 Forbidden'), locale).message}</p>;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      let workHours: Record<string, string> | undefined;
      if (workHoursJson.trim()) {
        workHours = parseWorkHours(workHoursJson);
      }
      const lat = latitude.trim() ? Number(latitude) : undefined;
      const lng = longitude.trim() ? Number(longitude) : undefined;
      const payload = buildAdminCreateBusinessPayload({
        title,
        slug,
        categoryId,
        shortDesc: shortDesc || undefined,
        description: description || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        instagram: instagram || undefined,
        website: website || undefined,
        workHours,
        subcategoryIds: subcategoryIds.length ? subcategoryIds : undefined,
        initialLocation: {
          cityId,
          address,
          latitude: lat,
          longitude: lng,
          phone: phone || undefined,
          whatsapp: whatsapp || undefined,
          instagram: instagram || undefined,
          website: website || undefined,
          workHours,
        },
      });
      const created = await adminCatalogApi.createBusiness(token, payload);
      router.push(`/catalog/businesses/${created.business.id}`);
    } catch (err) {
      setError(parseAdminCatalogApiError(err, locale).message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSub(id: string) {
    setSubcategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <section>
      <h1>{adminCatalogLabel(locale, 'pageCreateTitle')}</h1>
      <p className="muted">{adminCatalogLabel(locale, 'primaryBranchHint')}</p>

      {error && <p className="muted">{error}</p>}

      <form className="card" onSubmit={onSubmit} style={{ marginTop: 16, maxWidth: 720 }}>
        <label>
          {adminCatalogLabel(locale, 'fieldTitle')}
          <input required value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldSlug')}
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldCategory')}
          <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%' }}>
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
                  checked={subcategoryIds.includes(s.id)}
                  onChange={() => toggleSub(s.id)}
                />{' '}
                {locale === 'kk' ? s.nameKk : s.nameRu}
              </label>
            ))}
          </fieldset>
        )}

        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldShortDesc')}
          <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldDescription')}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%' }} />
        </label>

        <h3 style={{ marginTop: 20 }}>{adminCatalogLabel(locale, 'sectionLocations')}</h3>
        <label style={{ display: 'block' }}>
          {adminCatalogLabel(locale, 'fieldCity')}
          <select required value={cityId} onChange={(e) => setCityId(e.target.value)} style={{ width: '100%' }}>
            <option value="">—</option>
            {citiesAdmin.filter((c) => c.id).map((c) => (
              <option key={c.id} value={c.id}>
                {locale === 'kk' && c.nameKk ? c.nameKk : c.nameRu}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldAddress')}
          <input required value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: '100%' }} />
        </label>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <label>
            {adminCatalogLabel(locale, 'fieldLat')}
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </label>
          <label>
            {adminCatalogLabel(locale, 'fieldLng')}
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </label>
        </div>

        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldPhone')}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldWhatsapp')}
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldInstagram')}
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldWebsite')}
          <input value={website} onChange={(e) => setWebsite(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginTop: 12 }}>
          {adminCatalogLabel(locale, 'fieldWorkHours')}
          <textarea value={workHoursJson} onChange={(e) => setWorkHoursJson(e.target.value)} rows={2} style={{ width: '100%' }} />
        </label>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? adminCatalogLabel(locale, 'creating') : adminCatalogLabel(locale, 'createSubmit')}
          </button>
          <Link href="/catalog/businesses" className="btn btn-ghost">
            ←
          </Link>
        </div>
      </form>
    </section>
  );
}
