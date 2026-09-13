'use client';

import Link from 'next/link';
import { resolveIconUrl } from '@/lib/home-categories';

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:3002';

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

export function CategoryMoreTile({ href }: { href: string }) {
  return (
    <Link href={href} className="cat-tile" aria-label="Ещё категории">
      <div className="cat-tile__icon cat-tile__icon--more">⋯</div>
      <span className="cat-tile__title">Ещё</span>
    </Link>
  );
}
