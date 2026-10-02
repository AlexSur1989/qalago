import type { AppLocale, UiLabels } from './locale';
import { UI_LABELS } from './locale';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export type WorkHoursRow = {
  dayKey: (typeof DAY_KEYS)[number];
  label: string;
  value: string;
  isClosed: boolean;
};

function asHoursMap(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

/** Matches legacy RU/EN closed markers in stored business hours (not UI copy). */
function isClosedHoursString(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower === 'closed') return true;
  return lower.includes('\u0437\u0430\u043a\u0440');
}

function formatDayValue(raw: unknown, closedLabel: string): { text: string; isClosed: boolean } {
  if (raw == null) return { text: '—', isClosed: false };
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return { text: '—', isClosed: false };
    if (isClosedHoursString(trimmed)) {
      return { text: closedLabel, isClosed: true };
    }
    return { text: trimmed.replace(/-/g, ' – '), isClosed: false };
  }
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const map = raw as Record<string, unknown>;
    if (map.closed === true) return { text: closedLabel, isClosed: true };
    const open = map.open?.toString();
    const close = map.close?.toString();
    if (open && close) return { text: `${open} – ${close}`, isClosed: false };
  }
  return { text: '—', isClosed: false };
}

export function hasWorkHours(raw: unknown): boolean {
  const hours = asHoursMap(raw);
  if (!hours || Object.keys(hours).length === 0) return false;
  return Object.values(hours).some((value) => {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object') return Object.keys(value as object).length > 0;
    return true;
  });
}

/** Weekly rows for selected branch workHours (mon–sun). */
export function workHoursRows(
  raw: unknown,
  locale: AppLocale,
  labels?: Pick<UiLabels, 'businessHoursClosed' | 'workHoursWeekdays'>,
): WorkHoursRow[] {
  const hours = asHoursMap(raw);
  if (!hours) return [];
  const dict = labels ?? UI_LABELS[locale];
  const dayLabels = dict.workHoursWeekdays;
  return DAY_KEYS.map((dayKey, index) => {
    const { text, isClosed } = formatDayValue(hours[dayKey], dict.businessHoursClosed);
    return {
      dayKey,
      label: dayLabels[index] ?? dayKey,
      value: text,
      isClosed,
    };
  });
}
