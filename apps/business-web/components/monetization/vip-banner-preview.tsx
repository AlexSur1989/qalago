'use client';

type VipBannerPreviewProps = {
  creative: {
    imageUrl?: string | null;
    title: string;
    description?: string | null;
    buttonText?: string | null;
  };
};

export function VipBannerPreview({ creative }: VipBannerPreviewProps) {
  return (
    <div className="vip-banner-preview" data-testid="vip-banner-preview">
      <p className="field-label" style={{ marginTop: 0 }}>
        <strong>Предпросмотр</strong>
      </p>
      <div className="vip-banner-preview-inner">
        {creative.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creative.imageUrl} alt="" className="vip-banner-preview-image" />
        ) : (
          <div className="vip-banner-preview-image placeholder">Нет изображения</div>
        )}
        <div className="vip-banner-preview-content">
          <div className="vip-banner-preview-badge">Реклама</div>
          <h3 className="vip-banner-preview-title">{creative.title || 'Заголовок баннера'}</h3>
          {creative.description && (
            <p className="vip-banner-preview-desc">{creative.description}</p>
          )}
          {creative.buttonText && (
            <span className="vip-banner-preview-cta">{creative.buttonText}</span>
          )}
        </div>
      </div>
      <p className="vip-banner-preview-note">
        Период VIP-размещения начинается после одобрения баннера модератором.
      </p>
    </div>
  );
}
