import type { AppLocale, UiLabels } from '@/lib/locale';
import { UI_LABELS } from '@/lib/locale';

/** Locale-only consumer ad disclosure (ignore serve `displayLabel` — often RU-only or owner wording). */
export function consumerSponsoredLabel(locale: AppLocale): string {
  return UI_LABELS[locale].adLabel;
}

/** @deprecated Prefer `consumerSponsoredLabel`; backend label is not shown to consumers. */
export function sponsoredDisclosureLabel(
  locale: AppLocale,
  _backendLabel?: string | null,
): string {
  return consumerSponsoredLabel(locale);
}

export function SponsoredLabel({
  locale,
  backendLabel: _backendLabel,
  labels,
}: {
  locale: AppLocale;
  backendLabel?: string | null;
  labels?: UiLabels;
}) {
  const text = labels?.adLabel ?? consumerSponsoredLabel(locale);
  return <span className="ad-disclosure">{text}</span>;
}
