import Link from 'next/link';

export function PaginationLinks({
  basePath,
  page,
  totalPages,
  labels,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  labels: { paginationPrev: string; paginationNext: string; paginationPage: string };
}) {
  if (totalPages <= 1) return null;
  const sep = basePath.includes('?') ? '&' : '?';

  return (
    <nav className="pagination" aria-label={labels.paginationPage}>
      {page > 1 ? (
        <Link href={`${basePath}${sep}page=${page - 1}`}>{labels.paginationPrev}</Link>
      ) : null}
      <span className="pagination__status">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`${basePath}${sep}page=${page + 1}`}>{labels.paginationNext}</Link>
      ) : null}
    </nav>
  );
}
