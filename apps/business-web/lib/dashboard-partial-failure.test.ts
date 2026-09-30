import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardPage = readFileSync(
  join(process.cwd(), 'app/dashboard/page.tsx'),
  'utf8',
);

describe('business dashboard partial failure', () => {
  it('does not load all sections via one Promise.all', () => {
    expect(dashboardPage).not.toMatch(/Promise\.all\s*\(\s*\[\s*[\s\S]*analyticsSummary/);
  });

  it('uses independent retry keys per section', () => {
    expect(dashboardPage).toContain('setAnalyticsRetry');
    expect(dashboardPage).toContain('setCampaignsRetry');
    expect(dashboardPage).toContain('setPlanRetry');
    expect(dashboardPage).toContain('BackofficeErrorState');
  });

  it('does not set a global fatal error for section fetch failures', () => {
    expect(dashboardPage).not.toMatch(/setError\s*\(\s*parseApiError/);
    expect(dashboardPage).not.toContain('BackofficeAlert');
  });
});
