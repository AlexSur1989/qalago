import { describe, expect, it } from 'vitest';

export function mfaStatusLabel(status: string): string {
  if (status === 'ENABLED') return 'включена';
  if (status === 'ENROLLMENT_REQUIRED') return 'требуется настройка';
  return 'не настроена';
}

describe('staff MFA UI labels', () => {
  it('maps report statuses', () => {
    expect(mfaStatusLabel('ENABLED')).toBe('включена');
    expect(mfaStatusLabel('ENROLLMENT_REQUIRED')).toBe('требуется настройка');
    expect(mfaStatusLabel('NOT_CONFIGURED')).toBe('не настроена');
  });
});
