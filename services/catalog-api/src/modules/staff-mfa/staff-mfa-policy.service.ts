import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { isProductionNodeEnv } from '../../common/utils/production-config.util';
import { isStaffRole } from '../../common/utils/staff-access.util';

export type StaffMfaLoginDecision =
  | { kind: 'full' }
  | { kind: 'mfa_verify' }
  | { kind: 'enroll_required' };

@Injectable()
export class StaffMfaPolicyService {
  constructor(private readonly config: ConfigService) {}

  isSuperAdminMfaMandatory(): boolean {
    const qalagoEnv = this.config.get<string>('app.qalagoEnv', 'LOCAL');
    if (qalagoEnv === 'PRODUCTION') return true;
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    return isProductionNodeEnv(nodeEnv);
  }

  isStaffMfaRequiredForRole(role: UserRole): boolean {
    if (role === UserRole.SUPER_ADMIN) {
      return this.isSuperAdminMfaMandatory();
    }
    if (!isStaffRole(role)) return false;
    return this.config.get<boolean>('app.staffMfaRequired') === true;
  }

  loginDecision(input: {
    role: UserRole;
    mfaEnabled: boolean;
  }): StaffMfaLoginDecision {
    if (!isStaffRole(input.role)) {
      return { kind: 'full' };
    }
    const mustEnroll =
      !input.mfaEnabled && this.isStaffMfaRequiredForRole(input.role);
    if (mustEnroll) {
      return { kind: 'enroll_required' };
    }
    if (input.mfaEnabled) {
      return { kind: 'mfa_verify' };
    }
    return { kind: 'full' };
  }

  canDisableMfa(role: UserRole): boolean {
    if (role === UserRole.SUPER_ADMIN && this.isSuperAdminMfaMandatory()) {
      return false;
    }
    return true;
  }
}
