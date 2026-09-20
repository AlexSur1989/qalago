import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('moderation case detail dead PATCH removal', () => {
  it('does not call updateCase for manual status edits', () => {
    const src = readFileSync(
      join(__dirname, '../app/moderation/cases/[id]/page.tsx'),
      'utf8',
    );
    expect(src).not.toContain('updateCase');
    expect(src).toContain('recordAction');
  });
});
