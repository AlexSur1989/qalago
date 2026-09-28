import type { PresentationLocale } from './locale';

const TIER_LABELS: Record<string, Record<PresentationLocale, string>> = {
  FREE: { ru: 'Бесплатный', kk: 'Тегін' },
  BASIC: { ru: 'Бизнес', kk: 'Бизнес' },
  PRO: { ru: 'PRO', kk: 'PRO' },
  VIP: { ru: 'VIP', kk: 'VIP' },
};

export function planTierLabel(locale: PresentationLocale, tierCode: string): string {
  const key = tierCode.trim().toUpperCase();
  return TIER_LABELS[key]?.[locale] ?? tierCode;
}
