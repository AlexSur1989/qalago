import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, AuditResourceType } from '@prisma/client';
import { AuthUser, JwtPayload } from '../types/jwt-payload.type';
import { staffForbidden, StaffAuthErrorCode } from '../errors/staff-auth.errors';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';

/** Documented step-up window (Stage 6.9.1.1). */
export const STAFF_STEP_UP_TTL_SECONDS = 10 * 60;

@Injectable()
export class StaffStepUpService {
  constructor(
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  getTtlSeconds(): number {
    return this.config.get<number>('app.staffStepUpTtlSeconds', STAFF_STEP_UP_TTL_SECONDS);
  }

  isStepUpValid(payload: Pick<JwtPayload, 'stepUpAt'>): boolean {
    if (!payload.stepUpAt) return false;
    const ttl = this.getTtlSeconds();
    return payload.stepUpAt + ttl >= Math.floor(Date.now() / 1000);
  }

  assertRecentStepUp(user: AuthUser & JwtPayload): void {
    if (!this.isStepUpValid(user)) {
      throw staffForbidden(
        StaffAuthErrorCode.STEP_UP_REQUIRED,
        'Recent step-up verification required',
      );
    }
  }

  async recordStepUpVerified(actor: AuthUser): Promise<void> {
    await this.auditLog.record({
      actor,
      action: AuditAction.STAFF_STEP_UP_VERIFIED,
      resourceType: AuditResourceType.STAFF_ACCESS,
      resourceId: actor.id,
      targetUserId: actor.id,
    });
  }
}
