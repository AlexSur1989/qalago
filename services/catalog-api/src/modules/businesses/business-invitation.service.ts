import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuditAction,
  AuditResourceType,
  BusinessInvitationStatus,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessStatus,
  NotificationTargetType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { SlidingWindowRateLimitService } from '../../common/services/sliding-window-rate-limit.service';
import { generateInviteToken, hashInviteToken } from '../../common/utils/invite-token.util';
import {
  maskInvitationEmail,
  normalizeInvitationEmail,
} from '../../common/utils/email-normalize.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { resolveBusinessAuditCityId } from '../../common/utils/business-context-city.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { maskPhoneForAudit } from '../audit-log/audit-log.util';

export const TEAM_INVITE_TTL_DAYS = 7;

export type ResolvedInvitation = {
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  businessName: string;
  recipientEmailMasked: string | null;
  expiresAt: string;
};

@Injectable()
export class BusinessInvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly rateLimit: SlidingWindowRateLimitService,
    private readonly config: ConfigService,
    private readonly planLimits: PlanLimitsService,
    private readonly notifications: NotificationsService,
  ) {}

  buildInviteUrl(rawToken: string): string {
    const base =
      this.config.get<string>('app.businessWebBaseUrl') ?? 'http://localhost:3003';
    return `${base.replace(/\/$/, '')}/invite/${rawToken}`;
  }

  assertResolveRateLimit(clientKey: string): void {
    this.rateLimit.assertAllowed(
      `invitation-resolve:${clientKey}`,
      30,
      15 * 60 * 1000,
      'Too many invitation lookup attempts',
    );
  }

  assertAcceptRateLimit(userId: string): void {
    this.rateLimit.assertAllowed(
      `invitation-accept:${userId}`,
      10,
      15 * 60 * 1000,
      'Too many invitation acceptance attempts',
    );
  }

  async resolveByToken(rawToken: string): Promise<ResolvedInvitation> {
    const invitation = await this.findByRawToken(rawToken);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const effectiveStatus = this.effectiveStatus(invitation.status, invitation.expiresAt);

    return {
      status: effectiveStatus,
      businessName: invitation.business.title,
      recipientEmailMasked: invitation.email ? maskInvitationEmail(invitation.email) : null,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async acceptByToken(user: AuthUser, rawToken: string) {
    this.assertAcceptRateLimit(user.id);

    const tokenHash = hashInviteToken(rawToken.trim());
    const now = new Date();

    const accepted = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.businessInvitation.findFirst({
        where: { tokenHash },
        include: {
          business: { select: { id: true, title: true, status: true } },
        },
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      const effectiveStatus = this.effectiveStatus(invitation.status, invitation.expiresAt);
      if (effectiveStatus === BusinessInvitationStatus.ACCEPTED) {
        const existing = await tx.businessMembership.findUnique({
          where: {
            userId_businessId: { userId: user.id, businessId: invitation.businessId },
          },
        });
        if (existing) {
          return {
            businessId: invitation.businessId,
            membershipId: existing.id,
            alreadyAccepted: true,
          };
        }
        throw new BadRequestException('Invitation already accepted');
      }

      if (effectiveStatus !== BusinessInvitationStatus.PENDING) {
        throw new BadRequestException('Invitation is no longer valid');
      }

      if (invitation.business.status === BusinessStatus.BLOCKED) {
        throw new ForbiddenException('Business is not available');
      }

      if (invitation.email) {
        await this.assertAcceptingUserMatchesInvitationEmail(tx, user.id, invitation.email);
      }

      const existingMembership = await tx.businessMembership.findUnique({
        where: {
          userId_businessId: { userId: user.id, businessId: invitation.businessId },
        },
      });

      if (existingMembership?.role === BusinessMembershipRole.OWNER) {
        await tx.businessInvitation.update({
          where: { id: invitation.id },
          data: {
            status: BusinessInvitationStatus.REVOKED,
          },
        });
        throw new BadRequestException('Owner cannot accept manager invitation');
      }

      if (
        existingMembership?.role === BusinessMembershipRole.MANAGER &&
        existingMembership.status === BusinessMembershipStatus.ACTIVE
      ) {
        await tx.businessInvitation.update({
          where: { id: invitation.id },
          data: {
            status: BusinessInvitationStatus.ACCEPTED,
            acceptedByUserId: user.id,
            acceptedAt: now,
          },
        });
        return {
          businessId: invitation.businessId,
          membershipId: existingMembership.id,
          alreadyMember: true,
        };
      }

      await this.planLimits.assertCanAddManager(invitation.businessId, {
        excludeInvitationId: invitation.id,
      });

      const membership = await tx.businessMembership.upsert({
        where: {
          userId_businessId: { userId: user.id, businessId: invitation.businessId },
        },
        create: {
          userId: user.id,
          businessId: invitation.businessId,
          role: BusinessMembershipRole.MANAGER,
          status: BusinessMembershipStatus.ACTIVE,
          permissions: invitation.permissions,
        },
        update: {
          role: BusinessMembershipRole.MANAGER,
          status: BusinessMembershipStatus.ACTIVE,
          permissions: invitation.permissions,
        },
      });

      await tx.businessInvitation.update({
        where: { id: invitation.id },
        data: {
          status: BusinessInvitationStatus.ACCEPTED,
          acceptedByUserId: user.id,
          acceptedAt: now,
        },
      });

      const auditCityId = await resolveBusinessAuditCityId(tx, invitation.businessId);
      await this.auditLog.record({
        actor: user,
        action: AuditAction.TEAM_INVITATION_ACCEPT,
        resourceType: AuditResourceType.BUSINESS_INVITATION,
        resourceId: invitation.id,
        businessId: invitation.businessId,
        cityId: auditCityId ?? undefined,
        targetUserId: user.id,
        membershipRole: BusinessMembershipRole.MANAGER,
        metadata: {
          invitationId: invitation.id,
          membershipId: membership.id,
          permissionCount: invitation.permissions.length,
          viaToken: true,
        },
        tx,
      });

      let pushNotification;
      if (invitation.invitedByUserId && invitation.invitedByUserId !== user.id) {
        pushNotification = await this.notifications.create({
          userId: invitation.invitedByUserId,
          type: NotificationType.BUSINESS_INVITATION_ACCEPTED,
          title: 'Приглашение принято',
          body: `Пользователь принял приглашение в команду «${invitation.business.title}».`,
          targetType: NotificationTargetType.BUSINESS,
          targetId: invitation.businessId,
          payload: {
            businessId: invitation.businessId,
            invitationId: invitation.id,
            acceptedByUserId: user.id,
            businessName: invitation.business.title,
          },
          tx,
        });
      }

      return {
        businessId: invitation.businessId,
        membershipId: membership.id,
        alreadyMember: false,
        pushNotification,
      };
    });
    this.notifications.schedulePushAfterTransaction(
      'pushNotification' in accepted ? accepted.pushNotification : undefined,
    );
    if ('alreadyAccepted' in accepted && accepted.alreadyAccepted) {
      return {
        businessId: accepted.businessId,
        membershipId: accepted.membershipId,
        alreadyAccepted: true as const,
      };
    }
    return {
      businessId: accepted.businessId,
      membershipId: accepted.membershipId,
      alreadyMember: accepted.alreadyMember ?? false,
    };
  }

  createEmailInvitationParams(email: string) {
    const normalized = normalizeInvitationEmail(email);
    if (!normalized) {
      throw new BadRequestException('Invalid email address');
    }
    const rawToken = generateInviteToken();
    const tokenHash = hashInviteToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TEAM_INVITE_TTL_DAYS);
    return { normalized, rawToken, tokenHash, expiresAt };
  }

  maskRecipient(invitation: { email?: string | null; phone?: string | null }): string | null {
    if (invitation.email) return maskInvitationEmail(invitation.email);
    if (invitation.phone) return maskPhoneForAudit(invitation.phone);
    return null;
  }

  private async findByRawToken(rawToken: string) {
    const trimmed = rawToken?.trim();
    if (!trimmed) return null;

    const tokenHash = hashInviteToken(trimmed);
    return this.prisma.businessInvitation.findFirst({
      where: { tokenHash },
      include: { business: { select: { title: true, status: true, id: true } } },
    });
  }

  /** Email-token invites must be accepted by the matching auth identity (BIZ.3). */
  private async assertAcceptingUserMatchesInvitationEmail(
    tx: Prisma.TransactionClient,
    userId: string,
    invitationEmail: string,
  ): Promise<void> {
    const normalized = normalizeInvitationEmail(invitationEmail);
    if (!normalized) {
      throw new BadRequestException('Invalid invitation');
    }
    const identity = await tx.authIdentity.findFirst({
      where: {
        userId,
        email: { equals: normalized, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (!identity) {
      throw new ForbiddenException('Invitation email does not match your account');
    }
  }

  private effectiveStatus(
    status: BusinessInvitationStatus,
    expiresAt: Date,
  ): BusinessInvitationStatus {
    if (
      status === BusinessInvitationStatus.PENDING &&
      expiresAt.getTime() <= Date.now()
    ) {
      return BusinessInvitationStatus.EXPIRED;
    }
    return status;
  }
}
