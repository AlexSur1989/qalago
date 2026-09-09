import { describe, expect, it } from 'vitest';
import {
  applicationStatusLabel,
  buildListQuery,
  canAccessBusinessRequests,
  canModerateApplication,
  canModerateClaim,
  claimStatusLabel,
  isValidRejectionReason,
  mapBusinessRequestError,
  verificationMethodLabel,
} from './business-requests-utils';

describe('business-requests-utils', () => {
  it('allows moderator roles', () => {
    expect(canAccessBusinessRequests('SUPER_ADMIN')).toBe(true);
    expect(canAccessBusinessRequests('ADMIN')).toBe(true);
    expect(canAccessBusinessRequests('CITY_ADMIN')).toBe(true);
    expect(canAccessBusinessRequests('USER')).toBe(false);
    expect(canAccessBusinessRequests('BUSINESS')).toBe(false);
  });

  it('maps application status labels', () => {
    expect(applicationStatusLabel('PENDING')).toBe('На проверке');
    expect(applicationStatusLabel('APPROVED')).toBe('Одобрено');
    expect(applicationStatusLabel('DRAFT')).toBe('Черновик');
  });

  it('maps claim status labels', () => {
    expect(claimStatusLabel('PENDING')).toBe('На проверке');
    expect(claimStatusLabel('REJECTED')).toBe('Отклонено');
  });

  it('maps verification method labels', () => {
    expect(verificationMethodLabel('MANUAL')).toBe('Ручная проверка');
  });

  it('allows moderation only for pending items', () => {
    expect(canModerateApplication('PENDING')).toBe(true);
    expect(canModerateApplication('APPROVED')).toBe(false);
    expect(canModerateClaim('PENDING')).toBe(true);
    expect(canModerateClaim('CANCELLED')).toBe(false);
  });

  it('validates rejection reason length', () => {
    expect(isValidRejectionReason('ab')).toBe(false);
    expect(isValidRejectionReason('abc')).toBe(true);
    expect(isValidRejectionReason('a'.repeat(500))).toBe(true);
    expect(isValidRejectionReason('a'.repeat(501))).toBe(false);
  });

  it('builds list query params', () => {
    expect(buildListQuery({ page: 2, limit: 20, status: 'PENDING', citySlug: 'uralsk' })).toBe(
      '?page=2&limit=20&status=PENDING&citySlug=uralsk',
    );
    expect(buildListQuery({})).toBe('');
  });

  it('maps API errors to safe Russian messages', () => {
    expect(mapBusinessRequestError('409 Conflict')).toContain('уже изменился');
    expect(mapBusinessRequestError('403 Forbidden')).toContain('Недостаточно прав');
    expect(mapBusinessRequestError('duplicate business already exists')).toContain(
      'Похожий бизнес уже существует',
    );
    expect(mapBusinessRequestError('already an active owner')).toContain(
      'уже имеет права владельца',
    );
  });
});
