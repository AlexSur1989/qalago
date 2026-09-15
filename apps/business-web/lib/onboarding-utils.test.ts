import { describe, expect, it } from 'vitest';
import {
  applicationStatusLabel,
  claimStatusLabel,
  mapOnboardingError,
  membershipRoleLabel,
} from './onboarding-utils';

const ru = 'ru' as const;

describe('onboarding-utils', () => {
  it('maps application statuses', () => {
    expect(applicationStatusLabel(ru, 'PENDING')).toBe('На проверке');
    expect(applicationStatusLabel(ru, 'DRAFT')).toBe('Черновик');
  });

  it('maps claim statuses', () => {
    expect(claimStatusLabel(ru, 'APPROVED')).toBe('Одобрено');
  });

  it('maps membership roles', () => {
    expect(membershipRoleLabel(ru, 'OWNER')).toBe('Владелец');
    expect(membershipRoleLabel(ru, 'MANAGER')).toBe('Менеджер');
  });

  it('maps duplicate errors', () => {
    expect(mapOnboardingError(ru, 'duplicate business already exists')).toContain('Похожий бизнес');
  });

  it('maps rate limit errors', () => {
    expect(mapOnboardingError(ru, '429 Too Many Requests')).toBe(
      'Слишком много попыток. Попробуйте позже.',
    );
  });
});
