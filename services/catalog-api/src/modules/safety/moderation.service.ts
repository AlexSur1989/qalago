import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessStatus,
  ContentReportTargetType,
  ModerationActionType,
  ModerationAppealStatus,
  ModerationCaseStatus,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CityScopeService } from '../../common/services/city-scope.service';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { SafetyErrorCode } from './safety-errors';
import { SafetyRateLimitService } from './safety-rate-limit.service';
import { MAX_APPEAL_REASON_LENGTH, MAX_MODERATOR_NOTE_LENGTH } from './safety.constants';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly auditLog: AuditLogService,
    private readonly authSession: AuthSessionService,
    private readonly rateLimit: SafetyRateLimitService,
  ) {}

  async assertCanAccessCase(user: AuthUser, caseId: string) {
    const row = await this.prisma.moderationCase.findUnique({ where: { id: caseId } });
    if (!row) throw new NotFoundException('Case not found');
    await this.assertCityScope(user, row.cityId);
    return row;
  }

  async applyAction(
    actor: AuthUser,
    caseId: string,
    input: {
      actionType: ModerationActionType;
      reasonCode?: string;
      internalNote?: string;
    },
  ) {
    const moderationCase = await this.assertCanAccessCase(actor, caseId);
    const note = input.internalNote?.trim().slice(0, MAX_MODERATOR_NOTE_LENGTH) ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.moderationAction.create({
        data: {
          caseId,
          actorAdminId: actor.id,
          actionType: input.actionType,
          targetType: moderationCase.targetType,
          targetId: moderationCase.targetId,
          reasonCode: input.reasonCode ?? null,
          internalNote: note,
        },
      });

      await this.applyTargetMutation(
        tx,
        input.actionType,
        moderationCase.targetType,
        moderationCase.targetId,
      );

      await tx.moderationCase.update({
        where: { id: caseId },
        data: {
          status: ModerationCaseStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      });
    });

    if (input.actionType === ModerationActionType.USER_SUSPEND) {
      await this.suspendUserSessions(moderationCase.targetId);
    }

    await this.auditLog.record({
      actor,
      action: AuditAction.MODERATION_ACTION_APPLY,
      resourceType: AuditResourceType.MODERATION_CASE,
      resourceId: caseId,
      cityId: moderationCase.cityId ?? undefined,
      metadata: { actionType: input.actionType },
    });
  }

  private async applyTargetMutation(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    actionType: ModerationActionType,
    targetType: ContentReportTargetType,
    targetId: string,
  ) {
    switch (actionType) {
      case ModerationActionType.BUSINESS_HIDE:
        if (targetType === ContentReportTargetType.BUSINESS) {
          await tx.business.update({
            where: { id: targetId },
            data: { status: BusinessStatus.BLOCKED },
          });
        }
        break;
      case ModerationActionType.BUSINESS_RESTORE:
        if (targetType === ContentReportTargetType.BUSINESS) {
          await tx.business.update({
            where: { id: targetId },
            data: { status: BusinessStatus.ACTIVE },
          });
        }
        break;
      case ModerationActionType.REVIEW_HIDE:
        if (targetType === ContentReportTargetType.REVIEW) {
          await tx.review.update({
            where: { id: targetId },
            data: { moderationHidden: true },
          });
        }
        break;
      case ModerationActionType.REVIEW_RESTORE:
        if (targetType === ContentReportTargetType.REVIEW) {
          await tx.review.update({
            where: { id: targetId },
            data: { moderationHidden: false },
          });
        }
        break;
      case ModerationActionType.PROMOTION_HIDE:
        if (targetType === ContentReportTargetType.PROMOTION) {
          await tx.promotion.update({
            where: { id: targetId },
            data: { moderationHidden: true },
          });
        }
        break;
      case ModerationActionType.PROMOTION_RESTORE:
        if (targetType === ContentReportTargetType.PROMOTION) {
          await tx.promotion.update({
            where: { id: targetId },
            data: { moderationHidden: false },
          });
        }
        break;
      case ModerationActionType.MEDIA_HIDE:
        if (targetType === ContentReportTargetType.MEDIA) {
          await tx.businessImage.update({
            where: { id: targetId },
            data: { moderationHidden: true },
          });
        }
        break;
      case ModerationActionType.MEDIA_RESTORE:
        if (targetType === ContentReportTargetType.MEDIA) {
          await tx.businessImage.update({
            where: { id: targetId },
            data: { moderationHidden: false },
          });
        }
        break;
      case ModerationActionType.USER_SUSPEND:
        if (targetType === ContentReportTargetType.USER) {
          await tx.user.update({
            where: { id: targetId },
            data: { isActive: false },
          });
        }
        break;
      case ModerationActionType.USER_RESTORE:
        if (targetType === ContentReportTargetType.USER) {
          await tx.user.update({
            where: { id: targetId },
            data: { isActive: true },
          });
        }
        break;
      default:
        break;
    }
  }

  async suspendUserSessions(userId: string) {
    await this.authSession.revokeAllUserSessions(userId);
  }

  async submitAppeal(user: AuthUser, caseId: string, reason: string) {
    this.rateLimit.assertCanSubmitAppeal(user.id);
    const moderationCase = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
    });
    if (!moderationCase) throw new NotFoundException('Case not found');

    const allowed = await this.isAppealEligible(user.id, moderationCase.targetType, moderationCase.targetId);
    if (!allowed) {
      throw new ForbiddenException({
        message: 'Appeal not allowed',
        code: SafetyErrorCode.APPEAL_NOT_ALLOWED,
      });
    }

    const open = await this.prisma.moderationAppeal.findFirst({
      where: {
        caseId,
        appellantUserId: user.id,
        status: { in: [ModerationAppealStatus.SUBMITTED, ModerationAppealStatus.IN_REVIEW] },
      },
    });
    if (open) {
      throw new ForbiddenException({
        message: 'Appeal already submitted',
        code: SafetyErrorCode.APPEAL_ALREADY_SUBMITTED,
      });
    }

    return this.prisma.moderationAppeal.create({
      data: {
        caseId,
        appellantUserId: user.id,
        reason: reason.trim().slice(0, MAX_APPEAL_REASON_LENGTH),
      },
    });
  }

  private async isAppealEligible(
    userId: string,
    targetType: ContentReportTargetType,
    targetId: string,
  ): Promise<boolean> {
    if (targetType === ContentReportTargetType.BUSINESS) {
      const membership = await this.prisma.businessMembership.findFirst({
        where: {
          businessId: targetId,
          userId,
          status: 'ACTIVE',
          role: 'OWNER',
        },
      });
      return membership != null;
    }
    if (targetType === ContentReportTargetType.USER) {
      return targetId === userId;
    }
    return false;
  }

  async listCases(
    user: AuthUser,
    query: { status?: ModerationCaseStatus; page?: number; limit?: number },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const where = await this.buildCaseListWhere(user);
    if (query.status) {
      where.status = query.status;
    }
    const [items, total] = await Promise.all([
      this.prisma.moderationCase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moderationCase.count({ where }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  private async buildCaseListWhere(user: AuthUser) {
    const where: import('@prisma/client').Prisma.ModerationCaseWhereInput = {};
    if (user.role === UserRole.CITY_ADMIN) {
      const cityId = await this.cityScope.resolveAdminCityId(user);
      where.cityId = cityId;
    }
    return where;
  }

  private async assertCityScope(user: AuthUser, cityId: string | null) {
    if (!isGlobalAdmin(user) && user.role !== UserRole.CITY_ADMIN) {
      throw new ForbiddenException('Insufficient role');
    }
    if (user.role === UserRole.CITY_ADMIN) {
      if (!cityId) {
        throw new ForbiddenException('Case outside city scope');
      }
      await this.cityScope.assertBusinessInAdminScope(user, cityId);
    }
  }
}
