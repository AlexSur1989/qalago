import Link from 'next/link';
import type { PublicBusinessLocation } from '@/lib/public-business-location';
import { cityNameForLocale } from '@/lib/public-business-location';
import { canonicalBusinessPagePath } from '@/lib/business-page-paths';
import type { PublicLocale } from '@/lib/public-locale';

type Props = {
  locale: PublicLocale;
  businessSlug: string;
  branches: PublicBusinessLocation[];
  activeLocationId: string | null;
  labels: {
    branchesTitle: string;
    primaryBadge: string;
    selectedBranch: string;
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
    <section className="business-branches" aria-labelledby="business-branches-heading">
      <h2 id="business-branches-heading" className="business-showcase__heading">
        {labels.branchesTitle}
      </h2>
      <ul className="business-branches__list">
        {branches.map((branch) => {
          const isActive = activeLocationId != null && branch.id === activeLocationId;
          const href = canonicalBusinessPagePath(
            locale,
            branch.city.slug,
            businessSlug,
            branch.id,
          );
          return (
            <li key={branch.id}>
              <Link
                href={href}
                className={`business-branches__card${isActive ? ' business-branches__card--active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="business-branches__card-head">
                  <strong>{cityNameForLocale(locale, branch.city)}</strong>
                  <span className="business-branches__badges">
                    {isActive ? (
                      <span className="business-branches__badge business-branches__badge--selected">
                        {labels.selectedBranch}
                      </span>
                    ) : null}
                    {branch.isPrimary ? (
                      <span className="business-branches__badge">{labels.primaryBadge}</span>
                    ) : null}
                  </span>
                </div>
                <p className="business-branches__address">{branch.address}</p>
                {branch.phone ? (
                  <p className="business-branches__phone">{branch.phone}</p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
