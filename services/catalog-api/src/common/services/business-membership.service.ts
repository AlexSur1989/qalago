import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessInvitationStatus,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';

export type BusinessMembershipRecord = {
  id: string;
  userId: string;
  businessId: string;
  role: BusinessMembershipRole;
  status: BusinessMembershipStatus;
  permissions: import('@prisma/client').BusinessPermission[];
};

/**
 * Stage 5M.1 — business-scoped identity (OWNER/MANAGER memberships).
 * Authorization remains primarily in BusinessAccessService.
 */
@Injectable()
export class BusinessMembershipService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuditLogService))
    private readonly auditLog: AuditLogService,
  ) {}

  getMembership(userId: string, businessId: string) {
    return this.prisma.businessMembership.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
  }

  getActiveMembership(userId: string, businessId: string) {
    return this.prisma.businessMembership.findFirst({
      where: {
        userId,
        businessId,
        status: BusinessMembershipStatus.ACTIVE,
      },
    });
  }

  async isActiveOwner(userId: string, businessId: string): Promise<boolean> {
    const membership = await this.getActiveMembership(userId, businessId);
    return membership?.role === BusinessMembershipRole.OWNER;
  }

  /**
   * Owner access with Stage 5N.1 membership-authoritative semantics.
   *
   * If a membership row exists for (user, business), only ACTIVE OWNER grants access.
   * Legacy ownerId fallback applies only when no membership row exists.
   */
  async hasActiveOwnerAccess(
    userId: string,
    businessId: string,
    legacyOwnerId?: string | null,
  ): Promise<boolean> {
    const membership = await this.getMembership(userId, businessId);
    if (membership) {
      return (
        membership.role === BusinessMembershipRole.OWNER &&
        membership.status === BusinessMembershipStatus.ACTIVE
      );
    }
    return legacyOwnerId != null && legacyOwnerId === userId;
  }

  listOwnerBusinessIds(userId: string) {
    return this.prisma.businessMembership.findMany({
      where: {
        userId,
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      },
      select: { businessId: true },
    });
  }

  async createActiveOwnerMembership(
    tx: Prisma.TransactionClient,
    userId: string,
    businessId: string,
  ) {
    return tx.businessMembership.upsert({
      where: { userId_businessId: { userId, businessId } },
      create: {
        userId,
        businessId,
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      },
      update: {
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      },
    });
  }

  /**
   * Claim pending phone invitations after verified login (Stage 5M.2).
   */
  async claimPendingInvitations(userId: string, phone: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, role: true },
    });
    if (!actor) return;

    const authUser: AuthUser = {
      id: actor.id,
      sub: actor.id,
      phone: actor.phone,
      role: actor.role,
    };

    const now = new Date();
    const pending = await this.prisma.businessInvitation.findMany({
      where: {
        phone,
        status: BusinessInvitationStatus.PENDING,
        expiresAt: { gt: now },
      },
    });

    for (const invitation of pending) {
      const existing = await this.getMembership(userId, invitation.businessId);
      if (existing?.role === BusinessMembershipRole.OWNER) {
        await this.prisma.businessInvitation.update({
          where: { id: invitation.id },
          data: { status: BusinessInvitationStatus.REVOKED },
        });
        continue;
      }

      const business = await this.prisma.business.findUnique({
        where: { id: invitation.businessId },
        select: { cityId: true },
      });

      await this.prisma.$transaction(async (tx) => {
        const membership = await tx.businessMembership.upsert({
          where: { userId_businessId: { userId, businessId: invitation.businessId } },
          create: {
            userId,
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
          data: { status: BusinessInvitationStatus.ACCEPTED },
        });

        await this.auditLog.record({
          actor: authUser,
          action: AuditAction.TEAM_INVITATION_ACCEPT,
          resourceType: AuditResourceType.BUSINESS_INVITATION,
          resourceId: invitation.id,
          businessId: invitation.businessId,
          cityId: business?.cityId ?? null,
          targetUserId: userId,
          membershipRole: BusinessMembershipRole.MANAGER,
          metadata: {
            invitationId: invitation.id,
            membershipId: membership.id,
            permissionCount: invitation.permissions.length,
          },
          tx,
        });
      });
    }
  }
}
