import { authenticator } from 'otplib';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, AuditResourceType, Prisma, UserRole } from '@prisma/client';
import { StaffPermission } from '@qalago/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthSessionService, SessionUser } from '../auth/auth-session.service';
import { MfaRateLimitService } from '../../common/services/mfa-rate-limit.service';
import { StaffSessionService } from '../../common/services/staff-session.service';
import { StaffStepUpService } from '../../common/services/staff-step-up.service';
import {
  decryptStaffMfaSecret,
  encryptStaffMfaSecret,
  generateRecoveryCodePlain,
  hashRecoveryCode,
  normalizeRecoveryCodeInput,
  parseStaffMfaEncryptionKey,
  safeCompareHash,
} from '../../common/utils/staff-mfa-crypto.util';
import { isStaffRole, staffRoleHasPermission } from '../../common/utils/staff-access.util';
import { staffForbidden, StaffAuthErrorCode } from '../../common/errors/staff-auth.errors';
import { StaffMfaChallengeService } from './staff-mfa-challenge.service';
import { StaffMfaPolicyService } from './staff-mfa-policy.service';
import { StaffMfaEnrollVerifyDto, StaffMfaVerifyLoginDto } from './dto/staff-mfa.dto';
import { lockAuthSessions } from '../../common/utils/auth-session-lock.util';

authenticator.options = { window: 1 };

const RECOVERY_CODE_COUNT = 10;
const ENROLL_PENDING_MINUTES = 10;

export type StaffMfaPublicStatus = {
  enabled: boolean;
  method: 'TOTP' | null;
  enabledAt: string | null;
  recoveryCodesRemaining: number;
  requiresMfa: boolean;
  enrollmentRequired: boolean;
};

@Injectable()
export class StaffMfaService {
  private encryptionKey: Buffer | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogService,
    private readonly authSession: AuthSessionService,
    private readonly staffSession: StaffSessionService,
    private readonly staffStepUp: StaffStepUpService,
    private readonly mfaRateLimit: MfaRateLimitService,
    private readonly challenge: StaffMfaChallengeService,
    private readonly policy: StaffMfaPolicyService,
  ) {}

  private getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      this.encryptionKey = parseStaffMfaEncryptionKey(
        this.config.get<string>('app.staffMfaEncryptionKey'),
      );
    }
    return this.encryptionKey;
  }

  async isMfaEnabled(userId: string): Promise<boolean> {
    const cred = await this.prisma.staffMfaCredential.findUnique({
      where: { userId },
      select: { enabledAt: true, disabledAt: true },
    });
    return Boolean(cred?.enabledAt && !cred.disabledAt);
  }

  async getPublicStatus(actor: AuthUser): Promise<StaffMfaPublicStatus> {
    await this.assertActiveStaff(actor);
    const cred = await this.prisma.staffMfaCredential.findUnique({
      where: { userId: actor.id },
      include: {
        recoveryCodes: { where: { usedAt: null }, select: { id: true } },
      },
    });
    const enabled = Boolean(cred?.enabledAt && !cred?.disabledAt);
    const requiresMfa = this.policy.isStaffMfaRequiredForRole(actor.role);
    const enrollmentRequired = requiresMfa && !enabled;
    return {
      enabled,
      method: enabled ? 'TOTP' : null,
      enabledAt: cred?.enabledAt?.toISOString() ?? null,
      recoveryCodesRemaining: cred?.recoveryCodes.length ?? 0,
      requiresMfa,
      enrollmentRequired,
    };
  }

  async staffOverviewMfaCounts(): Promise<{
    enabled: number;
    enrollmentRequired: number;
    notConfigured: number;
  }> {
    const rows = await this.prisma.staffAccess.findMany({
      where: { isActive: true },
      select: { userId: true, staffRole: true },
    });
    let enabled = 0;
    let enrollmentRequired = 0;
    let notConfigured = 0;
    for (const row of rows) {
      const status = await this.reportMfaStatusForRole(row.userId, row.staffRole);
      if (status === 'ENABLED') enabled += 1;
      else if (status === 'ENROLLMENT_REQUIRED') enrollmentRequired += 1;
      else notConfigured += 1;
    }
    return { enabled, enrollmentRequired, notConfigured };
  }

  async reportMfaStatus(userId: string): Promise<'ENABLED' | 'NOT_CONFIGURED' | 'ENROLLMENT_REQUIRED'> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || !isStaffRole(user.role)) return 'NOT_CONFIGURED';
    return this.reportMfaStatusForRole(userId, user.role);
  }

  private async reportMfaStatusForRole(
    userId: string,
    role: UserRole,
  ): Promise<'ENABLED' | 'NOT_CONFIGURED' | 'ENROLLMENT_REQUIRED'> {
    const enabled = await this.isMfaEnabled(userId);
    if (enabled) return 'ENABLED';
    if (this.policy.isStaffMfaRequiredForRole(role)) return 'ENROLLMENT_REQUIRED';
    return 'NOT_CONFIGURED';
  }

  async enrollStart(actor: AuthUser) {
    await this.assertActiveStaff(actor);
    if (await this.isMfaEnabled(actor.id)) {
      throw new BadRequestException('MFA already enabled');
    }
    const secret = authenticator.generateSecret();
    const key = this.getEncryptionKey();
    const pendingSecretEncrypted = encryptStaffMfaSecret(secret, key);
    const pendingExpiresAt = new Date(Date.now() + ENROLL_PENDING_MINUTES * 60 * 1000);
    await this.prisma.staffMfaCredential.upsert({
      where: { userId: actor.id },
      create: {
        userId: actor.id,
        pendingSecretEncrypted,
        pendingExpiresAt,
      },
      update: {
        pendingSecretEncrypted,
        pendingExpiresAt,
        disabledAt: null,
      },
    });
    const label = this.otpLabel(actor);
    const otpauthUri = authenticator.keyuri(label, 'QalaGo', secret);
    await this.audit.record({
      actor,
      action: AuditAction.STAFF_MFA_ENROLL_STARTED,
      resourceType: AuditResourceType.USER,
      resourceId: actor.id,
      targetUserId: actor.id,
    });
    return {
      method: 'TOTP' as const,
      otpauthUri,
      secret,
      pendingExpiresAt: pendingExpiresAt.toISOString(),
    };
  }

  async enrollVerify(actor: AuthUser, dto: StaffMfaEnrollVerifyDto, ip: string) {
    await this.assertActiveStaff(actor);
    this.mfaRateLimit.assertCanEnrollVerify(actor.id);
    const cred = await this.prisma.staffMfaCredential.findUnique({ where: { userId: actor.id } });
    if (!cred?.pendingSecretEncrypted || !cred.pendingExpiresAt) {
      throw new BadRequestException('Enrollment not started');
    }
    if (cred.pendingExpiresAt <= new Date()) {
      throw new BadRequestException('Enrollment expired — start again');
    }
    const secret = decryptStaffMfaSecret(cred.pendingSecretEncrypted, this.getEncryptionKey());
    if (!this.checkTotp(secret, dto.totp, null)) {
      await this.audit.record({
        actor,
        action: AuditAction.STAFF_MFA_VERIFICATION_FAILED,
        resourceType: AuditResourceType.USER,
        resourceId: actor.id,
        metadata: { phase: 'enroll' },
      });
      throw staffForbidden(StaffAuthErrorCode.MFA_INVALID, 'Invalid authenticator code');
    }
    const secretEncrypted = encryptStaffMfaSecret(secret, this.getEncryptionKey());
    const now = new Date();
    const recovery = await this.prisma.$transaction(async (tx) => {
      await lockAuthSessions(tx, actor.id);
      const pending = await tx.staffMfaCredential.findUnique({ where: { userId: actor.id } });
      if (pending?.pendingSecretEncrypted !== cred.pendingSecretEncrypted ||
          !pending.pendingExpiresAt || pending.pendingExpiresAt <= new Date()) {
        throw new BadRequestException('Enrollment changed or expired — start again');
      }
      if (!actor.sid) throw new UnauthorizedException('Session required');
      const promoted = await tx.authSession.updateMany({
        where: { id: actor.sid, userId: actor.id, revokedAt: null, expiresAt: { gt: now } },
        data: { mfaEnrollOnly: false },
      });
      if (promoted.count !== 1) throw new UnauthorizedException('Session revoked or expired');
      // Other pre-enrollment sessions must authenticate again; enrollment is not global assurance.
      await tx.authSession.updateMany({
        where: { userId: actor.id, id: { not: actor.sid }, mfaEnrollOnly: true, revokedAt: null },
        data: { revokedAt: now },
      });
      const updated = await tx.staffMfaCredential.update({
        where: { userId: actor.id },
        data: {
          secretEncrypted,
          pendingSecretEncrypted: null,
          pendingExpiresAt: null,
          enabledAt: now,
          verifiedAt: now,
          disabledAt: null,
        },
      });
      await tx.staffAccess.updateMany({
        where: { userId: actor.id },
        data: { mfaEnrolledAt: now, mfaRequired: true },
      });
      const plainCodes = await this.createRecoveryCodesTx(tx, updated.id, actor.id);
      return plainCodes;
    });
    await this.audit.record({
      actor,
      action: AuditAction.STAFF_MFA_ENABLED,
      resourceType: AuditResourceType.USER,
      resourceId: actor.id,
      targetUserId: actor.id,
    });
    let accessToken: string | undefined;
    if (actor.sid) {
      const dbUser = await this.prisma.user.findUniqueOrThrow({
        where: { id: actor.id },
        select: { id: true, phone: true, email: true, name: true, role: true },
      });
      accessToken = await this.authSession.reissueStaffAccessToken(dbUser, actor.sid);
    }
    return { enabled: true, recoveryCodes: recovery, accessToken };
  }

  async verifyLogin(dto: StaffMfaVerifyLoginDto, ip: string) {
    const { userId } = await this.challenge.consumeChallenge(dto.mfaChallengeToken);
    this.mfaRateLimit.assertCanVerify(userId, ip);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, email: true, name: true, role: true, isActive: true },
    });
    if (!user?.isActive || !isStaffRole(user.role)) {
      throw new UnauthorizedException('Invalid staff account');
    }
    await this.staffSession.assertStaffAccessActive(user.id, user.role);
    const usedRecovery = Boolean(dto.recoveryCode);
    const ok = usedRecovery
      ? await this.consumeRecoveryCode(userId, dto.recoveryCode!)
      : await this.verifyUserTotp(userId, dto.totp!);
    if (!ok) {
      this.mfaRateLimit.recordVerifyFailure(userId, ip);
      await this.audit.record({
        actor: { id: userId, sub: userId, role: user.role },
        action: AuditAction.STAFF_MFA_VERIFICATION_FAILED,
        resourceType: AuditResourceType.USER,
        resourceId: userId,
        metadata: { phase: 'login' },
      });
      throw staffForbidden(StaffAuthErrorCode.MFA_INVALID, 'Invalid MFA code');
    }
    this.mfaRateLimit.clearVerifyAttempts(userId, ip);
    await this.audit.record({
      actor: { id: userId, sub: userId, role: user.role },
      action: AuditAction.STAFF_MFA_VERIFIED,
      resourceType: AuditResourceType.USER,
      resourceId: userId,
      metadata: { via: usedRecovery ? 'recovery' : 'totp' },
    });
    await this.prisma.staffAccess.updateMany({
      where: { userId },
      data: { lastStaffLoginAt: new Date() },
    });
    return this.authSession.issueQalaGoSession(user as SessionUser);
  }

  async verifyStepUp(actor: AuthUser, input: { totp?: string; recoveryCode?: string }, ip: string) {
    await this.assertActiveStaff(actor);
    if (!actor.sid) {
      throw staffForbidden(StaffAuthErrorCode.STAFF_SESSION_REVOKED, 'Session binding required');
    }
    const mfaOn = await this.isMfaEnabled(actor.id);
    if (!mfaOn) {
      return null;
    }
    this.mfaRateLimit.assertCanVerify(actor.id, ip);
    const ok = input.recoveryCode
      ? await this.consumeRecoveryCode(actor.id, input.recoveryCode)
      : await this.verifyUserTotp(actor.id, input.totp ?? '');
    if (!ok) {
      this.mfaRateLimit.recordVerifyFailure(actor.id, ip);
      throw staffForbidden(StaffAuthErrorCode.MFA_INVALID, 'Invalid MFA code');
    }
    this.mfaRateLimit.clearVerifyAttempts(actor.id, ip);
    const stepUpAt = Math.floor(Date.now() / 1000);
    await this.staffStepUp.recordStepUpVerified(actor);
    await this.audit.record({
      actor,
      action: AuditAction.STAFF_MFA_VERIFIED,
      resourceType: AuditResourceType.USER,
      resourceId: actor.id,
      metadata: { phase: 'step_up' },
    });
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { id: true, phone: true, email: true, name: true, role: true },
    });
    const accessToken = await this.authSession.issueStepUpAccessToken(
      dbUser,
      actor.sid,
      stepUpAt,
    );
    return { accessToken, stepUpAt };
  }

  async regenerateRecoveryCodes(actor: AuthUser, totp: string) {
    await this.assertActiveStaff(actor);
    this.staffStepUp.assertRecentStepUp(actor);
    if (!(await this.verifyUserTotp(actor.id, totp))) {
      throw staffForbidden(StaffAuthErrorCode.MFA_INVALID, 'Invalid authenticator code');
    }
    const cred = await this.requireEnabledCredential(actor.id);
    const codes = await this.prisma.$transaction(async (tx) => {
      await tx.staffMfaRecoveryCode.deleteMany({ where: { credentialId: cred.id, usedAt: null } });
      return this.createRecoveryCodesTx(tx, cred.id, actor.id);
    });
    await this.audit.record({
      actor,
      action: AuditAction.STAFF_MFA_RECOVERY_CODES_REGENERATED,
      resourceType: AuditResourceType.USER,
      resourceId: actor.id,
    });
    return { recoveryCodes: codes };
  }

  async disableSelf(actor: AuthUser, totp: string) {
    await this.assertActiveStaff(actor);
    if (!this.policy.canDisableMfa(actor.role)) {
      throw new ForbiddenException('MFA cannot be disabled for this account');
    }
    this.staffStepUp.assertRecentStepUp(actor);
    if (!(await this.verifyUserTotp(actor.id, totp))) {
      throw staffForbidden(StaffAuthErrorCode.MFA_INVALID, 'Invalid authenticator code');
    }
    await this.removeMfaCredential(actor.id);
    await this.authSession.revokeAllUserSessions(actor.id);
    await this.audit.record({
      actor,
      action: AuditAction.STAFF_MFA_DISABLED,
      resourceType: AuditResourceType.USER,
      resourceId: actor.id,
    });
    return { success: true };
  }

  async adminResetMfa(actor: AuthUser, targetUserId: string) {
    if (!staffRoleHasPermission(actor.role, StaffPermission.STAFF_UPDATE)) {
      throw staffForbidden(StaffAuthErrorCode.STAFF_PERMISSION_DENIED, 'Permission denied');
    }
    if (actor.id === targetUserId) {
      throw new BadRequestException('Use self-service MFA disable flow');
    }
    this.staffStepUp.assertRecentStepUp(actor);
    if (!(await this.isMfaEnabled(actor.id))) {
      throw staffForbidden(StaffAuthErrorCode.MFA_REQUIRED, 'Caller MFA required');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!target || !isStaffRole(target.role)) {
      throw new BadRequestException('Target is not staff');
    }
    if (
      target.role === UserRole.SUPER_ADMIN &&
      actor.role !== UserRole.SUPER_ADMIN
    ) {
      throw staffForbidden(StaffAuthErrorCode.STAFF_PERMISSION_DENIED, 'Cannot reset SUPER_ADMIN MFA');
    }
    if (
      target.role === UserRole.SUPER_ADMIN &&
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const otherSuper = await this.prisma.staffAccess.count({
        where: {
          staffRole: UserRole.SUPER_ADMIN,
          isActive: true,
          userId: { not: targetUserId },
        },
      });
      if (otherSuper === 0) {
        throw new BadRequestException(
          'Cannot reset MFA for the only active SUPER_ADMIN — use emergency CLI',
        );
      }
    }
    await this.removeMfaCredential(targetUserId);
    await this.authSession.revokeAllUserSessions(targetUserId);
    await this.audit.record({
      actor,
      action: AuditAction.STAFF_MFA_RESET,
      resourceType: AuditResourceType.USER,
      resourceId: targetUserId,
      targetUserId,
    });
    return { success: true };
  }

  async emergencyReset(userId: string, operatorNote: string) {
    await this.removeMfaCredential(userId);
    await this.authSession.revokeAllUserSessions(userId);
    await this.audit.record({
      actor: null,
      action: AuditAction.STAFF_MFA_EMERGENCY_RESET,
      resourceType: AuditResourceType.USER,
      resourceId: userId,
      targetUserId: userId,
      metadata: { operatorNote: operatorNote.slice(0, 200) },
    });
    return { success: true };
  }

  private async removeMfaCredential(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.staffMfaRecoveryCode.deleteMany({ where: { userId } });
      await tx.staffMfaCredential.deleteMany({ where: { userId } });
      await tx.staffAccess.updateMany({
        where: { userId },
        data: { mfaEnrolledAt: null, mfaRequired: false },
      });
    });
  }

  private async requireEnabledCredential(userId: string) {
    const cred = await this.prisma.staffMfaCredential.findUnique({ where: { userId } });
    if (!cred?.enabledAt || cred.disabledAt) {
      throw new BadRequestException('MFA not enabled');
    }
    return cred;
  }

  private async verifyUserTotp(userId: string, token: string): Promise<boolean> {
    const cred = await this.requireEnabledCredential(userId);
    if (!cred.secretEncrypted) return false;
    const secret = decryptStaffMfaSecret(cred.secretEncrypted, this.getEncryptionKey());
    if (!this.checkTotp(secret, token, cred.lastTotpStep)) return false;
    await this.persistTotpStep(userId, secret);
    return true;
  }

  private checkTotp(secret: string, token: string, lastStep: bigint | null): boolean {
    if (!authenticator.check(token, secret)) return false;
    const step = this.currentTotpStep();
    if (lastStep != null && step <= lastStep) {
      return false;
    }
    return true;
  }

  private currentTotpStep(): bigint {
    const stepSec = authenticator.options.step ?? 30;
    return BigInt(Math.floor(Date.now() / 1000 / stepSec));
  }

  private async persistTotpStep(userId: string, _secret: string) {
    await this.prisma.staffMfaCredential.update({
      where: { userId },
      data: { lastTotpStep: this.currentTotpStep(), lastUsedAt: new Date() },
    });
  }

  private async consumeRecoveryCode(userId: string, rawCode: string): Promise<boolean> {
    const normalized = normalizeRecoveryCodeInput(rawCode);
    const hash = hashRecoveryCode(normalized);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.staffMfaRecoveryCode.findFirst({
        where: { userId, usedAt: null },
      });
      if (!row) return false;
      const codes = await tx.staffMfaRecoveryCode.findMany({
        where: { userId, usedAt: null },
      });
      const match = codes.find((c) => safeCompareHash(c.codeHash, hash));
      if (!match) return false;
      const updated = await tx.staffMfaRecoveryCode.updateMany({
        where: { id: match.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (updated.count !== 1) return false;
      const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
      await this.audit.record({
        actor: user
          ? { id: userId, sub: userId, role: user.role }
          : { id: userId, sub: userId, role: UserRole.ADMIN },
        action: AuditAction.STAFF_MFA_RECOVERY_CODE_USED,
        resourceType: AuditResourceType.USER,
        resourceId: userId,
        metadata: { recoveryCodeId: match.id },
      });
      return true;
    });
  }

  private async createRecoveryCodesTx(
    tx: Prisma.TransactionClient,
    credentialId: string,
    userId: string,
  ): Promise<string[]> {
    const plain: string[] = [];
    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      const code = generateRecoveryCodePlain();
      plain.push(code);
      const normalized = normalizeRecoveryCodeInput(code);
      await tx.staffMfaRecoveryCode.create({
        data: {
          credentialId,
          userId,
          codeHash: hashRecoveryCode(normalized),
        },
      });
    }
    return plain;
  }

  private otpLabel(actor: AuthUser): string {
    if (actor.phone) {
      const tail = actor.phone.slice(-4);
      return `staff-${tail}`;
    }
    return `staff-${actor.id.slice(0, 8)}`;
  }

  private async assertActiveStaff(actor: AuthUser) {
    if (!isStaffRole(actor.role)) {
      throw staffForbidden(StaffAuthErrorCode.STAFF_ACCESS_REQUIRED, 'Staff only');
    }
    await this.staffSession.assertStaffAccessActive(actor.id, actor.role);
  }
}
