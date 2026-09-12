'use client';

type SafeReportTextProps = {
  text: string | null | undefined;
  className?: string;
  emptyLabel?: string;
};

/**
 * Plain-text UGC / report body — never uses dangerouslySetInnerHTML.
 */
export function SafeReportText({
  text,
  className = 'report-text-block',
  emptyLabel = '—',
}: SafeReportTextProps) {
  const value = text?.trim();
  if (!value) {
    return <span className="muted">{emptyLabel}</span>;
  }
  return <pre className={className}>{value}</pre>;
}
