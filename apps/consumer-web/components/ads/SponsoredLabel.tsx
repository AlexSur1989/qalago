import type { AppLocale, UiLabels } from '@/lib/locale';
import { UI_LABELS } from '@/lib/locale';

export function sponsoredDisclosureLabel(
  locale: AppLocale,
  backendLabel?: string | null,
): string {
  const trimmed = backendLabel?.trim();
  if (trimmed) return trimmed;
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
  const text = backendLabel?.trim() || labels?.adLabel || UI_LABELS[locale].adLabel;
  return <span className="ad-disclosure">{text}</span>;
}
