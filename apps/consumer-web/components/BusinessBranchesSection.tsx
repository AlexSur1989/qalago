import Link from 'next/link';
import type { PublicBusinessLocation } from '@/lib/public-business-location';
import { cityNameForLocale } from '@/lib/public-business-location';
import { canonicalBusinessPagePath } from '@/lib/business-page-paths';
import type { AppLocale } from '@/lib/locale';

type Props = {
  locale: AppLocale;
  businessSlug: string;
  branches: PublicBusinessLocation[];
  activeLocationId: string | null;
  labels: {
    branchesTitle: string;
    primaryBadge: string;
  };
};

export function BusinessBranchesSection({
  locale,
  businessSlug,
  branches,
  activeLocationId,
  labels,
}: Props) {
  if (branches.length <= 1) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>{labels.branchesTitle}</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {branches.map((branch) => {
          const isActive = activeLocationId != null && branch.id === activeLocationId;
          const href = canonicalBusinessPagePath(
            branch.city.slug,
            businessSlug,
            branch.id,
          );
          return (
            <li
              key={branch.id}
              style={{
                border: isActive
                  ? '2px solid var(--blue)'
                  : '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{cityNameForLocale(locale, branch.city)}</strong>
                {branch.isPrimary ? (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {labels.primaryBadge}
                  </span>
                ) : null}
              </div>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                <Link href={href} style={{ color: 'inherit', textDecoration: isActive ? 'underline' : 'none' }}>
                  {branch.address}
                </Link>
              </p>
              {branch.phone ? (
                <p style={{ margin: '4px 0 0', fontSize: 14 }}>{branch.phone}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
