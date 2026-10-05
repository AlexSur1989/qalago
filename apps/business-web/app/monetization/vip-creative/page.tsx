'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { ownerApi } from '@/lib/api';
import { VipBannerPreview } from '@/components/monetization/vip-banner-preview';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import { vipModerationPlacementNotice } from '@/lib/owner-utils';
import { parseApiError } from '@/lib/monetization-utils';
import { usePlatformFeatures } from '@/components/platform-features-provider';
import { PurchasesUnavailablePanel } from '@/components/monetization/purchases-unavailable-panel';

export default function VipCreativePage() {
  const locale = useLocale();
  const ui = useUi();

  return (
    <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>{ui.text_89d69a}</p>}>
      <VipCreativeContent />
    </Suspense>
  );
}

function VipCreativeContent() {
  const locale = useLocale();
  const ui = useUi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, business } = useMonetizationContext();
  const { canPurchaseAds, ready: platformReady } = usePlatformFeatures();

  const productCode = searchParams.get('productCode');
  const packageCode = searchParams.get('packageCode');
  const durationDays = searchParams.get('durationDays');
  const durationHours = searchParams.get('durationHours');
  const desiredStartAt = searchParams.get('desiredStartAt');
  const promotionId = searchParams.get('promotionId');

  const [title, setTitle] = useState(business.title);
  const [description, setDescription] = useState(business.shortDesc ?? '');
  const [buttonText, setButtonText] = useState(ui.text_db5f55);
  const [targetType, setTargetType] = useState<'BUSINESS' | 'PROMOTION' | 'EXTERNAL_URL'>(
    promotionId ? 'PROMOTION' : 'BUSINESS',
  );
  const [targetUrl, setTargetUrl] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(business.coverImageUrl ?? null);
  const [imageUploadToken, setImageUploadToken] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!productCode && !packageCode) {
    return (
      <div className="alert alert-error">
        {ui.____20b773}{' '}
        <Link href="/monetization/products">{ui.___bad998}</Link>
      </div>
    );
  }

  if (platformReady && !canPurchaseAds) {
    return (
      <PurchasesUnavailablePanel backHref="/monetization/campaigns" backLabel={ui.__f71231} />
    );
  }

  async function onImageChange(file: File | null) {
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    try {
      const result = await ownerApi.uploadImage(token, file, business.id);
      setImageUrl(result.url);
      setImageUploadToken(result.uploadToken);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError(ui.___f80533);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const creative = await ownerApi.createMonetizationCreative(token, {
        businessId: business.id,
        type: 'BANNER',
        imageUrl: imageUrl ?? undefined,
        ...(imageUploadToken ? { uploadToken: imageUploadToken } : {}),
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
      setError(parseApiError(locale, err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{ui._vip__4c7126}</h1>
          <p className="page-header-meta">{ui.____e4e179}</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <p className="alert" style={{ maxWidth: 720, fontSize: '0.9rem' }}>
        {vipModerationPlacementNotice(locale)}
      </p>

      <div className="creatives-layout">
        <form onSubmit={onSubmit} className="form-card">
          <label className="field-label">{ui.__542ad0}<input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
            />
            {uploading && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ui.text_89d69a}</span>
            )}
          </label>

          <label className="field-label">{ui.text_558981}<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </label>

          <label className="field-label">{ui.text_38ca0a}<textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>

          <label className="field-label">{ui.__77b793}<input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
          </label>

          <label className="field-label">{ui.___6bedb6}<select
              value={targetType}
              onChange={(e) =>
                setTargetType(e.target.value as 'BUSINESS' | 'PROMOTION' | 'EXTERNAL_URL')
              }
            >
              <option value="BUSINESS">{ui.__a849d7}</option>
              {promotionId && <option value="PROMOTION">{ui.__d6e9b9}</option>}
              <option value="EXTERNAL_URL">{ui.__db64ed}</option>
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
              {saving ? ui.text_73dba4 : ui.____67d60c}
            </button>
            <Link
              href={
                productCode
                  ? `/monetization/products/${productCode}`
                  : `/monetization/packages/${packageCode}`
              }
              className="btn btn-ghost"
            >{ui.text_2b0b02}</Link>
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
