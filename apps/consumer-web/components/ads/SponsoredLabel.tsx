import type { AppLocale, UiLabels } from '@/lib/locale';
import { UI_LABELS } from '@/lib/locale';

/** Server serve `displayLabel` is RU-only; locale chrome wins for generic disclosure. */
const GENERIC_AD_DISCLOSURE = new Set([
  UI_LABELS.ru.adLabel,
  UI_LABELS.kk.adLabel,
]);

export function sponsoredDisclosureLabel(
  locale: AppLocale,
  backendLabel?: string | null,
): string {
  const trimmed = backendLabel?.trim();
  if (trimmed && !GENERIC_AD_DISCLOSURE.has(trimmed)) return trimmed;
  return UI_LABELS[locale].adLabel;
}

export function SponsoredLabel({
  locale,
  backendLabel,
  labels,
}: {
  locale: AppLocale;
  backendLabel?: string | null;
  labels?: UiLabels;
}) {
  const text =
    labels?.adLabel ||
    sponsoredDisclosureLabel(locale, backendLabel);
  return <span className="ad-disclosure">{text}</span>;
}
