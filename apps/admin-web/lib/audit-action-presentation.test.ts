import { describe, expect, it } from 'vitest';
import { auditActionLabel } from './audit-action-presentation';

describe('audit-action-presentation (UXA.7)', () => {
  it('maps known audit actions to Russian labels', () => {
    expect(auditActionLabel('USER_ROLE_CHANGE')).toBe('Смена роли пользователя');
    expect(auditActionLabel('TEAM_INVITE')).toBe('Приглашение в команду');
  });

  it('never returns raw SCREAMING_SNAKE for unknown actions', () => {
    expect(auditActionLabel('FUTURE_ACTION_XYZ')).toBe('Неизвестное действие');
    expect(auditActionLabel('FUTURE_ACTION_XYZ')).not.toContain('_');
  });
});
