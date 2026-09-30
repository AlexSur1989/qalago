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
import { BackofficeErrorState } from '@qalago/brand/states';
import {
  BackofficeCheckbox,
  BackofficeField,
  BackofficeFieldGroup,
  BackofficeFormActions,
  BackofficeFormSection,
  BackofficeInput,
  BackofficeSelect,
  BackofficeTextarea,
} from '@qalago/brand/forms';

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

      {error ? (
        <BackofficeErrorState title={adminCatalogLabel(locale, 'errorLoad')} message={error} />
      ) : null}

      <form className="card bo-form-grid bo-form-grid--1" onSubmit={onSubmit} style={{ marginTop: 16, maxWidth: 720 }}>
        <BackofficeFormSection title={adminCatalogLabel(locale, 'sectionCore')}>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldTitle')} required>
            {({ id, describedBy, invalid }) => (
              <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} required value={title} onChange={(e) => setTitle(e.target.value)} />
            )}
          </BackofficeField>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldSlug')} required>
            {({ id, describedBy, invalid }) => (
              <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} required value={slug} onChange={(e) => setSlug(e.target.value)} />
            )}
          </BackofficeField>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldCategory')} required>
            {({ id, describedBy, invalid }) => (
              <BackofficeSelect id={id} aria-describedby={describedBy} invalid={invalid} required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
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
                  checked={subcategoryIds.includes(s.id)}
                  onChange={() => toggleSub(s.id)}
                />
              ))}
            </fieldset>
          )}
          <BackofficeField label={adminCatalogLabel(locale, 'fieldShortDesc')}>
            {({ id, describedBy, invalid }) => (
              <BackofficeTextarea id={id} aria-describedby={describedBy} invalid={invalid} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} />
            )}
          </BackofficeField>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldDescription')}>
            {({ id, describedBy, invalid }) => (
              <BackofficeTextarea id={id} aria-describedby={describedBy} invalid={invalid} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            )}
          </BackofficeField>
        </BackofficeFormSection>

        <BackofficeFormSection title={adminCatalogLabel(locale, 'sectionLocations')}>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldCity')} required>
            {({ id, describedBy, invalid }) => (
              <BackofficeSelect id={id} aria-describedby={describedBy} invalid={invalid} required value={cityId} onChange={(e) => setCityId(e.target.value)}>
                <option value="">—</option>
                {citiesAdmin.filter((c) => c.id).map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'kk' && c.nameKk ? c.nameKk : c.nameRu}
                  </option>
                ))}
              </BackofficeSelect>
            )}
          </BackofficeField>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldAddress')} required>
            {({ id, describedBy, invalid }) => (
              <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} required value={address} onChange={(e) => setAddress(e.target.value)} />
            )}
          </BackofficeField>
          <BackofficeFieldGroup columns="inline">
            <BackofficeField label={adminCatalogLabel(locale, 'fieldLat')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              )}
            </BackofficeField>
            <BackofficeField label={adminCatalogLabel(locale, 'fieldLng')}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              )}
            </BackofficeField>
          </BackofficeFieldGroup>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldPhone')}>
            {({ id, describedBy, invalid }) => (
              <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            )}
          </BackofficeField>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldWhatsapp')}>
            {({ id, describedBy, invalid }) => (
              <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            )}
          </BackofficeField>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldInstagram')}>
            {({ id, describedBy, invalid }) => (
              <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            )}
          </BackofficeField>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldWebsite')}>
            {({ id, describedBy, invalid }) => (
              <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
            )}
          </BackofficeField>
          <BackofficeField label={adminCatalogLabel(locale, 'fieldWorkHours')}>
            {({ id, describedBy, invalid }) => (
              <BackofficeTextarea id={id} aria-describedby={describedBy} invalid={invalid} value={workHoursJson} onChange={(e) => setWorkHoursJson(e.target.value)} rows={2} />
            )}
          </BackofficeField>
        </BackofficeFormSection>

        <BackofficeFormActions>
          <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? adminCatalogLabel(locale, 'creating') : adminCatalogLabel(locale, 'createSubmit')}
          </button>
          <Link href="/catalog/businesses" className="btn btn-ghost">
            Отмена
          </Link>
        </BackofficeFormActions>
      </form>
    </section>
  );
}
