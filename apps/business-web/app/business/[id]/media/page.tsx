'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BusinessImageRow, BusinessPlanStatus, ownerApi } from '@/lib/api';
import { mediaUrl } from '@/lib/media';
import { canViewPayments } from '@/lib/business-access';
import { parseApiError } from '@/lib/monetization-utils';
import { photoPublishLabel, photoPublishState } from '@/lib/owner-utils';
import { useOwnerBusiness } from '@/lib/use-owner-business';
import { BusinessShell } from '@/components/business-shell';

export default function BusinessMediaPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, businesses, business, access, error, setError, reloadBusinesses } =
    useOwnerBusiness(businessId);
  const [images, setImages] = useState<BusinessImageRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load(t: string) {
    const gallery = await ownerApi.listBusinessImages(t, businessId);
    setImages(gallery);
    if (canViewPayments(access)) {
      setPlanStatus(await ownerApi.getBusinessPlan(t, businessId));
    } else {
      setPlanStatus(null);
    }
    await reloadBusinesses();
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err) => setError(parseApiError(err)));
  }, [token, businessId, access]);

  const maxPhotos = planStatus?.limits.maxPhotos;
  const atPhotoLimit = maxPhotos != null && images.length >= maxPhotos;

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!token || !file) return;
    if (atPhotoLimit) {
      setError(`Достигнут лимит загрузки (${maxPhotos} фото). Улучшите тариф в разделе «Тариф».`);
      e.target.value = '';
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { url } = await ownerApi.uploadImage(token, file);
      await ownerApi.attachBusinessImage(token, businessId, url, images.length === 0);
      await load(token);
      e.target.value = '';
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  return (
    <BusinessShell
      activeNav="profile"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Фото и видео</h1>
          <p className="page-header-meta">Галерея карточки заведения в QalaGo</p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {planStatus && (
        <section className="form-card" style={{ maxWidth: 820, marginBottom: 18 }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Тариф «{planStatus.catalog.nameRu}»: {images.length} / {maxPhotos ?? '∞'} фото
            {planStatus.entitlements?.photos.overLimit &&
              planStatus.entitlements.photos.published != null && (
                <> · опубликовано {planStatus.entitlements.photos.published}</>
              )}
          </p>
          {planStatus.entitlements?.photos.overLimit && (
            <p className="alert" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
              На тарифе «{planStatus.catalog.nameRu}» публикуется до {maxPhotos} фото. Остальные
              сохранены и снова появятся после повышения тарифа.
            </p>
          )}
        </section>
      )}

      <section className="form-card" style={{ maxWidth: 820, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Загрузить фото</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          JPG/PNG до 5 МБ. Первое фото можно сделать обложкой автоматически.
        </p>
        <label
          className={`btn btn-primary${atPhotoLimit ? ' btn-ghost' : ''}`}
          style={{ cursor: atPhotoLimit ? 'not-allowed' : 'pointer', width: 'fit-content' }}
        >
          {uploading ? 'Загрузка…' : atPhotoLimit ? 'Лимит фото достигнут' : 'Выбрать файл'}
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
        <h2 style={{ marginTop: 0 }}>Галерея ({images.length})</h2>
        {images.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Пока нет фото</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 14,
            }}
          >
            {images.map((image, index) => {
              const src = mediaUrl(image.imageUrl);
              const isCover = business?.coverImageUrl === image.imageUrl;
              const publishState = photoPublishState(index, planStatus);
              const publishLabel = photoPublishLabel(publishState);
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
                    {isCover && <span className="tag tag-success">Обложка</span>}
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
                      {!isCover && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={async () => {
                            if (!token) return;
                            await ownerApi.setBusinessCover(token, businessId, image.id);
                            await load(token);
                          }}
                        >
                          На обложку
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={async () => {
                          if (!token) return;
                          await ownerApi.deleteBusinessImage(token, businessId, image.id);
                          await load(token);
                        }}
                      >
                        Удалить
                      </button>
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
