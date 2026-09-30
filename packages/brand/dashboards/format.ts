/** Presentation-only KPI formatters — do not alter numeric semantics. */

export function formatKpiCount(value: number, locale = 'ru-RU'): string {
  return value.toLocaleString(locale);
}

export function formatKpiKzt(value: number, locale = 'ru-RU'): string {
  return `${value.toLocaleString(locale)} ₸`;
}

export function formatKpiPercent(value: number, locale = 'ru-RU'): string {
  return `${value.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
}
