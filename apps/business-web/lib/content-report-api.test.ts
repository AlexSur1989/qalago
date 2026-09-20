import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('ownerApi.reportReview wiring', () => {
  it('posts REVIEW target to /reports', () => {
    const src = readFileSync(join(__dirname, 'api.ts'), 'utf8');
    expect(src).toContain("targetType: 'REVIEW'");
    expect(src).toContain("api<{ reportId: string; caseId: string }>('/reports'");
  });
});
