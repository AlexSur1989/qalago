'use client';

import { useUi } from '@/components/locale-provider';
type VipBannerPreviewProps = {
  creative: {
    imageUrl?: string | null;
    title: string;
    description?: string | null;
    buttonText?: string | null;
  };
};

export function VipBannerPreview({ creative }: VipBannerPreviewProps) {
  const ui = useUi();

  return (
    <div className="vip-banner-preview" data-testid="vip-banner-preview">
      <p className="field-label" style={{ marginTop: 0 }}>
        <strong>{ui.text_278bed}</strong>
      </p>
      <div className="vip-banner-preview-inner">
        {creative.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creative.imageUrl} alt="" className="vip-banner-preview-image" />
        ) : (
          <div className="vip-banner-preview-image placeholder">{ui.__cd92a5}</div>
        )}
        <div className="vip-banner-preview-content">
          <div className="vip-banner-preview-badge">{ui.text_becb26}</div>
          <h3 className="vip-banner-preview-title">{creative.title || ui.__31c205}</h3>
          {creative.description && (
            <p className="vip-banner-preview-desc">{creative.description}</p>
          )}
          {creative.buttonText && (
            <span className="vip-banner-preview-cta">{creative.buttonText}</span>
          )}
        </div>
      </div>
      <p className="vip-banner-preview-note">{ui._vip___a86cb0}</p>
    </div>
  );
}
