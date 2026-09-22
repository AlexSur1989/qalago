'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BusinessImageRow,
  BusinessLocationRow,
  BusinessPlanStatus,
  CityRow,
  ownerApi,
} from '@/lib/api';
import { mediaUrl } from '@/lib/media';
import {
  buildAttachBusinessImageBody,
  buildGlobalPhotoPublishIndexMap,
  buildListBusinessImagesQuery,
  canSetBusinessCover,
  formatBranchMediaLabel,
  isBrandMediaScope,
  MEDIA_SCOPE_BRAND,
  normalizeMediaScopeAfterLocationsLoad,
  type MediaScopeSelection,
} from '@/lib/media-scope';
import {
  buildFooterNavItems,
  buildMainNavItems,
  canViewPayments,
  filterNavByAccess,
} from '@/lib/business-access';
import { parseApiError } from '@/lib/monetization-utils';
import { photoPublishLabel, photoPublishState } from '@/lib/owner-utils';
import { useOwnerBusiness } from '@/lib/use-owner-business';
import { BusinessShell } from '@/components/business-shell';

export default function BusinessMediaPage() {
  const locale = useLocale();
  const ui = useUi();

  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, businesses, business, access, error, setError, reloadBusinesses } =
    useOwnerBusiness(businessId);
  const [images, setImages] = useState<BusinessImageRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [locations, setLocations] = useState<BusinessLocationRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [selectedScope, setSelectedScope] = useState<MediaScopeSelection>(MEDIA_SCOPE_BRAND);
  const [publishIndexById, setPublishIndexById] = useState<Map<string, number>>(new Map());

  const mainNav = useMemo(
    () => filterNavByAccess(buildMainNavItems(locale), access),
    [access, locale],
  );
  const footerNav = useMemo(
    () => filterNavByAccess(buildFooterNavItems(locale), access),
    [access, locale],
  );

  const totalPhotoUsage = planStatus?.usage.photos ?? planStatus?.entitlements?.photos.total;

  const loadScopeImages = useCallback(
    async (t: string, scope: MediaScopeSelection) => {
      const query = buildListBusinessImagesQuery(scope);
      const [scoped, allImages] = await Promise.all([
        ownerApi.listBusinessImages(t, businessId, query),
        ownerApi.listBusinessImages(t, businessId, { scope: 'all' }),
      ]);
      setImages(scoped);
      setPublishIndexById(buildGlobalPhotoPublishIndexMap(allImages));
    },
    [businessId],
  );

  const load = useCallback(
    async (t: string, scope: MediaScopeSelection) => {
      await loadScopeImages(t, scope);
      if (canViewPayments(access)) {
        setPlanStatus(await ownerApi.getBusinessPlan(t, businessId));
      } else {
        setPlanStatus(null);
      }
      await reloadBusinesses();
    },
    [access, businessId, loadScopeImages, reloadBusinesses],
  );

  useEffect(() => {
    if (!token) return;
    setLocationsLoading(true);
    Promise.all([ownerApi.listBusinessLocations(token, businessId), ownerApi.listCities()])
      .then(([locRes, cityRows]) => {
        setLocations(locRes.items);
        setCities(cityRows);
        setSelectedScope((prev) => normalizeMediaScopeAfterLocationsLoad(prev, locRes.items));
      })
      .catch((err) => setError(parseApiError(locale, err)))
      .finally(() => setLocationsLoading(false));
  }, [token, businessId, locale, setError]);

  useEffect(() => {
    if (!token) return;
    load(token, selectedScope).catch((err) => setError(parseApiError(locale, err)));
  }, [token, businessId, selectedScope, load, locale, setError]);

  const maxPhotos = planStatus?.limits.maxPhotos;
  const atPhotoLimit =
    maxPhotos != null && totalPhotoUsage != null && totalPhotoUsage >= maxPhotos;

  const branchLocations = useMemo(
    () =>
      [...locations].sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) ||
          a.createdAt.localeCompare(b.createdAt) ||
          a.id.localeCompare(b.id),
      ),
    [locations],
  );

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!token || !file) return;
    if (atPhotoLimit) {
      setError(ui.____3aa9f1);
      e.target.value = '';
      return;
    }
    setUploading(true);
    setError(null);
    const scopeAtUpload = selectedScope;
    try {
      const { url } = await ownerApi.uploadImage(token, file);
      const asCover =
        isBrandMediaScope(scopeAtUpload) && images.length === 0 && canSetBusinessCover(scopeAtUpload);
      const body = buildAttachBusinessImageBody(url, scopeAtUpload, asCover);
      await ownerApi.attachBusinessImage(token, businessId, body.imageUrl, {
        asCover: body.asCover,
        locationId: body.locationId,
      });
      await load(token, scopeAtUpload);
      e.target.value = '';
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setUploading(false);
    }
  }

  const galleryHeading = ui.mediaGallerySectionTitle.replace('${count}', String(images.length));
  const emptyCopy = isBrandMediaScope(selectedScope) ? ui.mediaEmptyBrand : ui.mediaEmptyBranch;
  const showCoverActions = canSetBusinessCover(selectedScope);

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  return (
    <BusinessShell
      activeNav="media"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
      mainNav={mainNav}
      footerNav={footerNav}
    >
      <header className="page-header">
        <div>
          <h1>{ui.___c89390}</h1>
          <p className="page-header-meta">{ui.____3236ca}</p>
        </div>
        <Link href="/dashboard" className="btn">{ui.__65f9d8}</Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {planStatus && totalPhotoUsage != null && (
        <section className="form-card" style={{ maxWidth: 820, marginBottom: 18 }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {ui.ownerPlanQuotaPhotosLine
              .replace('${planName}', planStatus.catalog.nameRu)
              .replace('${used}', String(totalPhotoUsage))
              .replace('${max}', String(maxPhotos ?? '∞'))}
            {planStatus.entitlements?.photos.overLimit &&
              planStatus.entitlements.photos.published != null && (
                <>
                  {ui.ownerPlanQuotaPublishedSuffix.replace(
                    '${count}',
                    String(planStatus.entitlements.photos.published),
                  )}
                </>
              )}
          </p>
          {planStatus.entitlements?.photos.overLimit && (
            <p className="alert" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
              {ui.ownerPlanQuotaPhotosOverLimitPrefix
                .replace('${planName}', planStatus.catalog.nameRu)
                .replace('${max}', String(maxPhotos))}
              {ui.text_mediaArchivedAfterUpgrade}
            </p>
          )}
        </section>
      )}

      <section className="form-card" style={{ maxWidth: 820, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>{ui.mediaScopeBrand}</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="media-scope"
              checked={isBrandMediaScope(selectedScope)}
              onChange={() => setSelectedScope(MEDIA_SCOPE_BRAND)}
            />
            <span>{ui.mediaScopeBrand}</span>
          </label>
          {locationsLoading ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.mediaScopeLoadingLocations}</p>
          ) : branchLocations.length > 0 ? (
            <>
              <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{ui.mediaScopeBranchesHeading}</p>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {branchLocations.map((location) => {
                  const label = formatBranchMediaLabel(
                    locale,
                    location,
                    cities,
                    ui.mediaScopePrimarySuffix,
                  );
                  return (
                    <li key={location.id}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="media-scope"
                          checked={selectedScope === location.id}
                          onChange={() => setSelectedScope(location.id)}
                        />
                        <span>{label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      <section className="form-card" style={{ maxWidth: 820, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>
          {isBrandMediaScope(selectedScope) ? ui.mediaScopeBrand : ui.mediaScopeBranchPhotosHeading}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{ui.jpg_png__5_f0b0b6}</p>
        <label
          className={`btn btn-primary${atPhotoLimit ? ' btn-ghost' : ''}`}
          style={{ cursor: atPhotoLimit ? 'not-allowed' : 'pointer', width: 'fit-content' }}
        >
          {uploading ? ui.text_89d69a : atPhotoLimit ? ui.___c228da : ui.__b43615}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={uploading || atPhotoLimit}
            onChange={onFileSelected}
          />
        </label>
      </section>

      <section className="form-card" style={{ maxWidth: 820 }}>
        <h2 style={{ marginTop: 0 }}>{galleryHeading}</h2>
        {images.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>{emptyCopy}</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 14,
            }}
          >
            {images.map((image) => {
              const src = mediaUrl(image.imageUrl);
              const isCover = business?.coverImageUrl === image.imageUrl;
              const globalIndex = publishIndexById.get(image.id) ?? 0;
              const publishState = photoPublishState(globalIndex, planStatus);
              const publishLabel = photoPublishLabel(locale, publishState);
              return (
                <article
                  key={image.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    style={{ width: '100%', height: 140, objectFit: 'cover' }}
                  />
                  <div style={{ padding: 10, display: 'grid', gap: 8 }}>
                    {isCover && showCoverActions && (
                      <span className="tag tag-success">{ui.text_7407ba}</span>
                    )}
                    {publishLabel && (
                      <span
                        className={
                          publishState === 'published' ? 'tag tag-success' : 'tag tag-warning'
                        }
                      >
                        {publishLabel}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {showCoverActions && !isCover && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={async () => {
                            if (!token) return;
                            await ownerApi.setBusinessCover(token, businessId, image.id);
                            await load(token, selectedScope);
                          }}
                        >
                          {ui.text_setAsCover}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={async () => {
                          if (!token) return;
                          await ownerApi.deleteBusinessImage(token, businessId, image.id);
                          await load(token, selectedScope);
                        }}
                      >{ui.text_ed2bbf}</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </BusinessShell>
  );
}
