'use client';

import Link from 'next/link';
import { resolveIconUrl } from '@/lib/home-categories';

import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

export function CategoryIconTile({
  title,
  icon,
  href,
}: {
  title: string;
  icon?: string | null;
  href: string;
}) {
  const src = resolveIconUrl(icon ?? null, API_ORIGIN);
  return (
    <Link href={href} className="cat-tile" aria-label={title}>
      <div className="cat-tile__icon">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" width={56} height={56} loading="lazy" />
        ) : (
          <span className="cat-tile__fallback" aria-hidden />
        )}
      </div>
      <span className="cat-tile__title">{title}</span>
    </Link>
  );
}

export function CategoryMoreTile({
  href,
  title,
  ariaLabel,
}: {
  href: string;
  title: string;
  ariaLabel: string;
}) {
  return (
    <Link href={href} className="cat-tile" aria-label={ariaLabel}>
      <div className="cat-tile__icon cat-tile__icon--more">⋯</div>
      <span className="cat-tile__title">{title}</span>
    </Link>
  );
}
