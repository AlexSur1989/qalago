import { describe, expect, it } from 'vitest';
import { staffActivePresentation, staffRoleLabel } from './staff-presentation';

describe('staff-presentation (UXA.7)', () => {
  it('maps staff roles to human labels', () => {
    expect(staffRoleLabel('SUPER_ADMIN')).toBe('Суперадминистратор');
    expect(staffRoleLabel('CITY_ADMIN')).toBe('Администратор города');
  });

  it('uses safe fallback for unknown roles', () => {
    expect(staffRoleLabel('NOT_A_REAL_ROLE')).toBe('Неизвестная роль');
  });

  it('maps active state tones', () => {
    expect(staffActivePresentation(true).tone).toBe('success');
    expect(staffActivePresentation(false).tone).toBe('danger');
  });
});
