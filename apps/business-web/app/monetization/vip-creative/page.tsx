'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { ownerApi } from '@/lib/api';
import { VipBannerPreview } from '@/components/monetization/vip-banner-preview';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import { VIP_MODERATION_NOTICE } from '@/lib/owner-utils';
import { parseApiError } from '@/lib/monetization-utils';

export default function VipCreativePage() {
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>}>
      <VipCreativeContent />
    </Suspense>
  );
}

function VipCreativeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, business } = useMonetizationContext();

  const productCode = searchParams.get('productCode');
  const packageCode = searchParams.get('packageCode');
  const durationDays = searchParams.get('durationDays');
  const durationHours = searchParams.get('durationHours');
  const desiredStartAt = searchParams.get('desiredStartAt');
  const promotionId = searchParams.get('promotionId');

  const [title, setTitle] = useState(business.title);
  const [description, setDescription] = useState(business.shortDesc ?? '');
  const [buttonText, setButtonText] = useState('Подробнее');
  const [targetType, setTargetType] = useState<'BUSINESS' | 'PROMOTION' | 'EXTERNAL_URL'>(
    promotionId ? 'PROMOTION' : 'BUSINESS',
  );
  const [targetUrl, setTargetUrl] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(business.coverImageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!productCode && !packageCode) {
    return (
      <div className="alert alert-error">
        Не указан продукт или пакет.{' '}
        <Link href="/monetization/products">Вернуться в каталог</Link>
      </div>
    );
  }

  async function onImageChange(file: File | null) {
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    try {
      const result = await ownerApi.uploadImage(token, file);
      setImageUrl(result.url);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Укажите заголовок баннера');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const creative = await ownerApi.createMonetizationCreative(token, {
        businessId: business.id,
        type: 'BANNER',
        imageUrl: imageUrl ?? undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        buttonText: buttonText.trim() || undefined,
        targetType,
        targetId:
          targetType === 'BUSINESS'
            ? business.id
            : targetType === 'PROMOTION'
              ? promotionId ?? undefined
              : undefined,
        targetUrl: targetType === 'EXTERNAL_URL' ? targetUrl.trim() || undefined : undefined,
      });

      const q = new URLSearchParams();
      q.set('creativeId', creative.id);
      if (productCode) q.set('productCode', productCode);
      if (packageCode) q.set('packageCode', packageCode);
      if (durationDays) q.set('durationDays', durationDays);
      if (durationHours) q.set('durationHours', durationHours);
      if (desiredStartAt) q.set('desiredStartAt', desiredStartAt);
      if (promotionId) q.set('promotionId', promotionId);

      router.push(`/monetization/checkout?${q.toString()}`);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Креатив VIP-баннера</h1>
          <p className="page-header-meta">Загрузите баннер и тексты для модерации</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <p className="alert" style={{ maxWidth: 720, fontSize: '0.9rem' }}>
        {VIP_MODERATION_NOTICE}
      </p>

      <div className="creatives-layout">
        <form onSubmit={onSubmit} className="form-card">
          <label className="field-label">
            Изображение баннера
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
            />
            {uploading && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Загрузка…</span>
            )}
          </label>

          <label className="field-label">
            Заголовок *
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </label>

          <label className="field-label">
            Описание
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>

          <label className="field-label">
            Текст кнопки
            <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
          </label>

          <label className="field-label">
            Куда ведёт клик
            <select
              value={targetType}
              onChange={(e) =>
                setTargetType(e.target.value as 'BUSINESS' | 'PROMOTION' | 'EXTERNAL_URL')
              }
            >
              <option value="BUSINESS">Карточка заведения</option>
              {promotionId && <option value="PROMOTION">Продвигаемая акция</option>}
              <option value="EXTERNAL_URL">Внешняя ссылка</option>
            </select>
          </label>

          {targetType === 'EXTERNAL_URL' && (
            <label className="field-label">
              URL
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://"
              />
            </label>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? 'Сохранение…' : 'Сохранить и перейти к оплате'}
            </button>
            <Link
              href={
                productCode
                  ? `/monetization/products/${productCode}`
                  : `/monetization/packages/${packageCode}`
              }
              className="btn btn-ghost"
            >
              Назад
            </Link>
          </div>
        </form>

        <div className="creative-preview-panel">
          <VipBannerPreview
            creative={{ imageUrl, title, description, buttonText }}
          />
        </div>
      </div>
    </>
  );
}
