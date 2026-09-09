import { describe, expect, it } from 'vitest';
import {
  applicationStatusLabel,
  claimStatusLabel,
  mapOnboardingError,
  membershipRoleLabel,
} from './onboarding-utils';

describe('onboarding-utils', () => {
  it('maps application statuses', () => {
    expect(applicationStatusLabel('PENDING')).toBe('На проверке');
    expect(applicationStatusLabel('DRAFT')).toBe('Черновик');
  });

  it('maps claim statuses', () => {
    expect(claimStatusLabel('APPROVED')).toBe('Одобрено');
  });

  it('maps membership roles', () => {
    expect(membershipRoleLabel('OWNER')).toBe('Владелец');
    expect(membershipRoleLabel('MANAGER')).toBe('Менеджер');
  });

  it('maps duplicate errors', () => {
    expect(mapOnboardingError('duplicate business already exists')).toContain('Похожий бизнес');
  });
});
