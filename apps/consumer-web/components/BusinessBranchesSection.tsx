import type { PublicBusinessLocation } from '@/lib/public-business-location';
import { cityNameForLocale } from '@/lib/public-business-location';
import type { AppLocale } from '@/lib/locale';

type Props = {
  locale: AppLocale;
  branches: PublicBusinessLocation[];
  labels: {
    branchesTitle: string;
    primaryBadge: string;
  };
};

export function BusinessBranchesSection({ locale, branches, labels }: Props) {
  if (branches.length <= 1) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>{labels.branchesTitle}</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {branches.map((branch) => (
          <li
            key={branch.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong>{cityNameForLocale(locale, branch.city)}</strong>
              {branch.isPrimary ? (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{labels.primaryBadge}</span>
              ) : null}
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{branch.address}</p>
            {branch.phone ? (
              <p style={{ margin: '4px 0 0', fontSize: 14 }}>{branch.phone}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
