import {
  BadRequestException,
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
  Notification,
  NotificationTargetType,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CityScopeService } from '../../common/services/city-scope.service';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import {
  StaffPermission,
  staffRoleHasPermission,
} from '../../common/utils/staff-access.util';
import { loadPrimaryCityPresentationByBusinessId } from '../../common/utils/business-primary-city-presentation.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { SafetyErrorCode } from './safety-errors';
import { SafetyRateLimitService } from './safety-rate-limit.service';
import {
  isMediaTargetCase,
  isReviewTargetCase,
  resolveModerationMediaTarget,
  resolveModerationReviewTarget,
} from './moderation-case-detail.util';
import {
  MAX_APPEAL_REASON_LENGTH,
  MAX_MODERATOR_NOTE_LENGTH,
  MIN_MODERATOR_NOTE_LENGTH,
} from './safety.constants';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly auditLog: AuditLogService,
    private readonly authSession: AuthSessionService,
    private readonly rateLimit: SafetyRateLimitService,
    private readonly notifications: NotificationsService,
  ) {}

  async assertCanAccessCase(
    user: AuthUser,
    caseId: string,
    permission: StaffPermission = StaffPermission.MODERATION_ACT,
  ) {
    const row = await this.prisma.moderationCase.findUnique({ where: { id: caseId } });
    if (!row) throw new NotFoundException('Case not found');
    await this.assertCityScope(user, row.cityId, permission);
    return row;
  }

  async getCaseDetail(user: AuthUser, caseId: string) {
    const moderationCase = await this.assertCanAccessCase(
      user,
      caseId,
      StaffPermission.MODERATION_VIEW,
    );

    const [reportLinks, actions, city, reviewRow, mediaRow] = await Promise.all([
      this.prisma.moderationCaseReport.findMany({
        where: { caseId },
        include: {
          report: {
            include: {
              reporter: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { report: { createdAt: 'asc' } },
      }),
      this.prisma.moderationAction.findMany({
        where: { caseId },
        orderBy: { createdAt: 'asc' },
        include: {
          actorAdmin: { select: { id: true, name: true, role: true } },
        },
      }),
      moderationCase.cityId
        ? this.prisma.city.findUnique({
            where: { id: moderationCase.cityId },
            select: { id: true, slug: true, nameRu: true },
          })
        : Promise.resolve(null),
      isReviewTargetCase(moderationCase.targetType)
        ? this.prisma.review.findUnique({
            where: { id: moderationCase.targetId },
            select: {
              id: true,
              rating: true,
              text: true,
              ownerReply: true,
              moderationHidden: true,
              deletedAt: true,
              createdAt: true,
              updatedAt: true,
              user: { select: { id: true, name: true, phone: true } },
              business: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          })
        : Promise.resolve(null),
      isMediaTargetCase(moderationCase.targetType)
        ? this.prisma.businessImage.findUnique({
            where: { id: moderationCase.targetId },
            select: {
              id: true,
              imageUrl: true,
              locationId: true,
              moderationHidden: true,
              business: {
                select: {
                  id: true,
                  title: true,
                },
              },
              branchLocation: {
                select: {
                  id: true,
                  address: true,
                  isPrimary: true,
                  city: {
                    select: {
                      id: true,
                      slug: true,
                      nameRu: true,
                      nameKk: true,
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    const businessIdsForCity = [
      reviewRow?.business.id,
      mediaRow?.business.id,
    ].filter((id): id is string => Boolean(id));
    const primaryCityByBusinessId =
      businessIdsForCity.length > 0
        ? await loadPrimaryCityPresentationByBusinessId(this.prisma, businessIdsForCity)
        : new Map();

    const reviewRowWithCity =
      reviewRow == null
        ? null
        : {
            ...reviewRow,
            business: {
              ...reviewRow.business,
              city: (() => {
                const cityRow = primaryCityByBusinessId.get(reviewRow.business.id);
                return cityRow
                  ? { id: cityRow.id, slug: cityRow.slug, nameRu: cityRow.nameRu }
                  : null;
              })(),
            },
          };

    const mediaRowWithCity =
      mediaRow == null
        ? null
        : {
            ...mediaRow,
            business: {
              ...mediaRow.business,
              city: (() => {
                const cityRow = primaryCityByBusinessId.get(mediaRow.business.id);
                return cityRow
                  ? { id: cityRow.id, slug: cityRow.slug, nameRu: cityRow.nameRu }
                  : null;
              })(),
            },
          };

    const reports = reportLinks.map((link) => ({
      id: link.report.id,
      targetType: link.report.targetType,
      targetId: link.report.targetId,
      reason: link.report.reason,
      details: link.report.details,
      status: link.report.status,
      createdAt: link.report.createdAt,
      updatedAt: link.report.updatedAt,
      reporter: link.report.reporter
        ? {
            id: link.report.reporter.id,
            name: link.report.reporter.name,
            phone: link.report.reporter.phone,
          }
        : null,
    }));

    const reviewTarget = isReviewTargetCase(moderationCase.targetType)
      ? resolveModerationReviewTarget(reviewRowWithCity)
      : undefined;

    const mediaTarget = isMediaTargetCase(moderationCase.targetType)
      ? resolveModerationMediaTarget(mediaRowWithCity)
      : undefined;

    return {
      ...moderationCase,
      city,
      reports,
      actions,
      reviewTarget,
      mediaTarget,
    };
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

    if (
      (input.actionType === ModerationActionType.REVIEW_HIDE ||
        input.actionType === ModerationActionType.REVIEW_RESTORE) &&
      (!note || note.length < MIN_MODERATOR_NOTE_LENGTH)
    ) {
      throw new BadRequestException({
        message: 'Moderation note required',
        code: SafetyErrorCode.MODERATION_NOTE_REQUIRED,
      });
    }

    let effectiveSnapshot = moderationCase.targetSnapshot;

    const pushAfterCommit = await this.prisma.$transaction(async (tx) => {
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

      if (
        input.actionType === ModerationActionType.BUSINESS_HIDE &&
        moderationCase.targetType === ContentReportTargetType.BUSINESS
      ) {
        const business = await tx.business.findUnique({
          where: { id: moderationCase.targetId },
          select: { status: true },
        });
        if (business && business.status !== BusinessStatus.BLOCKED) {
          const prev = effectiveSnapshot as Record<string, unknown> | null;
          effectiveSnapshot = {
            ...(prev ?? {}),
            businessStatusBeforeModerationHide: business.status,
          };
          await tx.moderationCase.update({
            where: { id: caseId },
            data: { targetSnapshot: effectiveSnapshot as object },
          });
        }
      }

      const reviewBefore =
        (input.actionType === ModerationActionType.REVIEW_HIDE ||
          input.actionType === ModerationActionType.REVIEW_RESTORE) &&
        moderationCase.targetType === ContentReportTargetType.REVIEW
          ? await this.loadReviewForModerationNotify(tx, moderationCase.targetId)
          : null;

      await this.applyTargetMutation(
        tx,
        input.actionType,
        moderationCase.targetType,
        moderationCase.targetId,
        effectiveSnapshot,
      );

      let pushNotification: Notification | undefined;
      if (reviewBefore) {
        pushNotification = await this.notifyReviewModerationOutcome(
          tx,
          reviewBefore,
          input.actionType,
          moderationCase.targetId,
        );
      }

      await tx.moderationCase.update({
        where: { id: caseId },
        data: {
          status: ModerationCaseStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      });
      return pushNotification;
    });
    this.notifications.schedulePushAfterTransaction(pushAfterCommit);

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
    targetSnapshot?: unknown,
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
          const snap = targetSnapshot as Record<string, unknown> | null | undefined;
          const prior = snap?.businessStatusBeforeModerationHide as
            | BusinessStatus
            | undefined;
          const restoreStatus =
            prior && prior !== BusinessStatus.BLOCKED ? prior : BusinessStatus.ACTIVE;
          await tx.business.update({
            where: { id: targetId },
            data: { status: restoreStatus },
          });
        }
        break;
      case ModerationActionType.REVIEW_HIDE:
        if (targetType === ContentReportTargetType.REVIEW) {
          const review = await tx.review.findUnique({
            where: { id: targetId },
            select: { id: true },
          });
          if (review) {
            await tx.review.update({
              where: { id: targetId },
              data: { moderationHidden: true },
            });
          }
        }
        break;
      case ModerationActionType.REVIEW_RESTORE:
        if (targetType === ContentReportTargetType.REVIEW) {
          const review = await tx.review.findUnique({
            where: { id: targetId },
            select: { id: true, deletedAt: true },
          });
          if (review) {
            await tx.review.update({
              where: { id: targetId },
              data: { moderationHidden: false },
            });
          }
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

  private async loadReviewForModerationNotify(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    reviewId: string,
  ) {
    return tx.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        businessId: true,
        moderationHidden: true,
        deletedAt: true,
        business: { select: { title: true } },
      },
    });
  }

  private async notifyReviewModerationOutcome(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    before: {
      id: string;
      userId: string;
      businessId: string;
      moderationHidden: boolean;
      deletedAt: Date | null;
      business: { title: string };
    },
    actionType: ModerationActionType,
    reviewId: string,
  ): Promise<Notification | undefined> {
    if (before.deletedAt !== null) {
      return undefined;
    }

    if (
      actionType === ModerationActionType.REVIEW_HIDE &&
      !before.moderationHidden
    ) {
      return this.notifications.create({
        userId: before.userId,
        type: NotificationType.REVIEW_HIDDEN,
        title: 'Отзыв скрыт модерацией',
        body: `Ваш отзыв о «${before.business.title}» скрыт из публичного каталога.`,
        targetType: NotificationTargetType.REVIEW,
        targetId: reviewId,
        payload: { businessId: before.businessId, reviewId },
        tx,
      });
    }

    if (
      actionType === ModerationActionType.REVIEW_RESTORE &&
      before.moderationHidden
    ) {
      return this.notifications.create({
        userId: before.userId,
        type: NotificationType.REVIEW_RESTORED,
        title: 'Отзыв восстановлен',
        body: `Ваш отзыв о «${before.business.title}» снова виден в каталоге.`,
        targetType: NotificationTargetType.REVIEW,
        targetId: reviewId,
        payload: { businessId: before.businessId, reviewId },
        tx,
      });
    }
    return undefined;
  }

  private async assertCityScope(
    user: AuthUser,
    cityId: string | null,
    permission: StaffPermission,
  ) {
    const canAccess =
      isGlobalAdmin(user) ||
      user.role === UserRole.CITY_ADMIN ||
      staffRoleHasPermission(user.role, permission);
    if (!canAccess) {
      throw new ForbiddenException('Insufficient role');
    }
    if (user.role === UserRole.CITY_ADMIN) {
      if (!cityId) {
        throw new ForbiddenException('Case outside city scope');
      }
      await this.cityScope.assertCityInAdminScope(user, cityId);
    }
  }
}
