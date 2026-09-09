/** Stage 6.5 — timezone-aware local date/hour for business analytics aggregation. */

export const DEFAULT_ANALYTICS_TIMEZONE = 'Asia/Oral';

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timezone: string): Intl.DateTimeFormat {
  const key = timezone || DEFAULT_ANALYTICS_TIMEZONE;
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: key,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dateFormatterCache.set(key, formatter);
  }
  return formatter;
}

function getPartsFormatter(timezone: string): Intl.DateTimeFormat {
  const key = timezone || DEFAULT_ANALYTICS_TIMEZONE;
  let formatter = partsFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: key,
      hour: 'numeric',
      hour12: false,
      weekday: 'short',
    });
    partsFormatterCache.set(key, formatter);
  }
  return formatter;
}

/** Returns YYYY-MM-DD in the business/city local timezone. */
export function toLocalMetricDate(utcDate: Date, timezone?: string | null): string {
  const tz = timezone?.trim() || DEFAULT_ANALYTICS_TIMEZONE;
  try {
    return getDateFormatter(tz).format(utcDate);
  } catch {
    return getDateFormatter(DEFAULT_ANALYTICS_TIMEZONE).format(utcDate);
  }
}

/** Returns local hour 0–23 and weekday 0=Sun..6=Sat in the given timezone. */
export function toLocalHourAndWeekday(
  utcDate: Date,
  timezone?: string | null,
): { hour: number; weekday: number } {
  const tz = timezone?.trim() || DEFAULT_ANALYTICS_TIMEZONE;
  try {
    const parts = getPartsFormatter(tz).formatToParts(utcDate);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const weekdayToken = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return { hour: hour === 24 ? 0 : hour, weekday: weekdayMap[weekdayToken] ?? 0 };
  } catch {
    return {
      hour: utcDate.getUTCHours(),
      weekday: utcDate.getUTCDay(),
    };
  }
}

/** UTC window covering all events that may fall on `metricDate` in `timezone`. */
export function utcWindowForLocalDate(
  metricDate: string,
  timezone?: string | null,
): { from: Date; to: Date } {
  const tz = timezone?.trim() || DEFAULT_ANALYTICS_TIMEZONE;
  const start = localDateTimeToUtc(`${metricDate}T00:00:00`, tz);
  const end = localDateTimeToUtc(`${metricDate}T23:59:59.999`, tz);
  return { from: start, to: end };
}

function localDateTimeToUtc(localIso: string, timezone: string): Date {
  const guess = new Date(`${localIso}Z`);
  const offsetMs = getTimezoneOffsetMs(guess, timezone);
  return new Date(guess.getTime() - offsetMs);
}

function getTimezoneOffsetMs(date: Date, timezone: string): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return local.getTime() - utc.getTime();
}
