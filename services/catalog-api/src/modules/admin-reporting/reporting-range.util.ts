import { BadRequestException } from '@nestjs/common';
import { MAX_REPORT_RANGE_DAYS } from './reporting.constants';

export type ReportRange = {
  from: Date;
  to: Date;
  fromMetricDate: string;
  toMetricDate: string;
};

function toMetricDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseReportRange(fromRaw?: string, toRaw?: string): ReportRange {
  const to = toRaw ? new Date(toRaw) : new Date();
  if (Number.isNaN(to.getTime())) {
    throw new BadRequestException('Invalid "to" date');
  }
  const fromDefault = new Date(to);
  fromDefault.setUTCDate(fromDefault.getUTCDate() - 30);
  const from = fromRaw ? new Date(fromRaw) : fromDefault;
  if (Number.isNaN(from.getTime())) {
    throw new BadRequestException('Invalid "from" date');
  }
  if (from > to) {
    throw new BadRequestException('"from" must be before or equal to "to"');
  }
  const spanMs = to.getTime() - from.getTime();
  const spanDays = spanMs / (24 * 60 * 60 * 1000);
  if (spanDays > MAX_REPORT_RANGE_DAYS) {
    throw new BadRequestException(`Report range cannot exceed ${MAX_REPORT_RANGE_DAYS} days`);
  }
  return {
    from,
    to,
    fromMetricDate: toMetricDate(from),
    toMetricDate: toMetricDate(to),
  };
}
