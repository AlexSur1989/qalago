'use client';

import type { MonetizationCreativeRow } from '@/lib/monetization-api';

type VipBannerPreviewProps = {
  creative: Pick<
    MonetizationCreativeRow,
    'imageUrl' | 'title' | 'description' | 'buttonText'
  >;
};

export function VipBannerPreview({ creative }: VipBannerPreviewProps) {
  return (
    <div className="vip-banner-preview" data-testid="vip-banner-preview">
      <div className="vip-banner-preview-inner">
        {creative.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creative.imageUrl} alt="" className="vip-banner-preview-image" />
        ) : (
          <div className="vip-banner-preview-image placeholder">Нет изображения</div>
        )}
        <div className="vip-banner-preview-content">
          <div className="vip-banner-preview-badge">Реклама</div>
          <h3 className="vip-banner-preview-title">{creative.title}</h3>
          {creative.description && (
            <p className="vip-banner-preview-desc">{creative.description}</p>
          )}
          {creative.buttonText && (
            <span className="vip-banner-preview-cta">{creative.buttonText}</span>
          )}
        </div>
      </div>
      <p className="vip-banner-preview-note">
        Период VIP-размещения начинается после одобрения баннера.
      </p>
    </div>
  );
}
