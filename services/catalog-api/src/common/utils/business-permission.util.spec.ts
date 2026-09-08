import { BadRequestException } from '@nestjs/common';
import { BusinessPermission } from '@prisma/client';
import {
  getRequiredPermissionsForPatch,
  normalizeBusinessPermissions,
  validatePermissionDependencies,
} from './business-permission.util';

describe('business-permission.util', () => {
  it('normalizeBusinessPermissions adds ANALYTICS_VIEW when EXPORT present', () => {
    const result = normalizeBusinessPermissions([BusinessPermission.ANALYTICS_EXPORT]);
    expect(result).toContain(BusinessPermission.ANALYTICS_VIEW);
    expect(result).toContain(BusinessPermission.ANALYTICS_EXPORT);
  });

  it('validatePermissionDependencies rejects EXPORT without VIEW in input', () => {
    expect(() =>
      validatePermissionDependencies([BusinessPermission.ANALYTICS_EXPORT]),
    ).toThrow(BadRequestException);
  });

  it('getRequiredPermissionsForPatch maps profile and hours fields', () => {
    const perms = getRequiredPermissionsForPatch({
      title: 'New title',
      workHours: { mon: '9-18' },
    });
    expect(perms).toContain(BusinessPermission.BUSINESS_PROFILE_EDIT);
    expect(perms).toContain(BusinessPermission.BUSINESS_HOURS_EDIT);
  });

  it('getRequiredPermissionsForPatch hours only', () => {
    const perms = getRequiredPermissionsForPatch({ workHours: { mon: '9-18' } });
    expect(perms).toEqual([BusinessPermission.BUSINESS_HOURS_EDIT]);
  });
});
