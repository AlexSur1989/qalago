/** Stage 5K — CSV cell escaping (semicolon delimiter, formula-injection safe). */

export const CSV_DELIMITER = ';';

export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  let str = String(value);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r') ||
    str.includes(CSV_DELIMITER)
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatCsvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(escapeCsvCell).join(CSV_DELIMITER);
}

export function sanitizeExportFilenamePart(value: string): string {
  const cleaned = value
    .replace(/[^\p{L}\p{N}\-_ ]/gu, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '');
  return cleaned || 'business';
}

export function buildAnalyticsExportFilename(
  businessId: string,
  businessTitle: string,
  periodStart: string,
  periodEnd: string,
): string {
  const slug = sanitizeExportFilenamePart(businessTitle) || businessId.slice(0, 8);
  return `qalago-analytics-${slug}-${periodStart}_${periodEnd}.csv`;
}

export function buildContentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
