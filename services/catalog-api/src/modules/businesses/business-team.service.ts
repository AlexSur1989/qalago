import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessInvitationStatus,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessPermission,
  Prisma,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import { normalizeKazakhstanPhone } from '../auth/auth-phone.util';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import {
  normalizeBusinessPermissions,
  validatePermissionDependencies,
} from '../../common/utils/business-permission.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { maskPhoneForAudit, permissionDiff } from '../audit-log/audit-log.util';
import { InviteTeamMemberDto, UpdateTeamMemberDto } from './dto/team.dto';
import { BusinessInvitationService, TEAM_INVITE_TTL_DAYS } from './business-invitation.service';

const INVITE_TTL_DAYS = TEAM_INVITE_TTL_DAYS;

@Injectable()
export class BusinessTeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly membership: BusinessMembershipService,
    private readonly auditLog: AuditLogService,
    private readonly invitations: BusinessInvitationService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async listTeam(user: AuthUser, businessId: string) {
    await this.assertTeamReadAccess(user, businessId);

    const members = await this.prisma.businessMembership.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    const pendingInvites = await this.prisma.businessInvitation.findMany({
      where: { businessId, status: BusinessInvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });

    const maskPhone = user.role === UserRole.CITY_ADMIN;

    return {
      members: members.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        name: m.user.name,
        phone:
          m.user.phone != null
            ? maskPhone
              ? this.maskPhone(m.user.phone)
              : m.user.phone
            : null,
        role: m.role,
        status: m.status,
        permissions: m.role === BusinessMembershipRole.OWNER ? [] : m.permissions,
        createdAt: m.createdAt,
      })),
      pendingInvitations: pendingInvites.map((inv) => ({
        invitationId: inv.id,
        phone: inv.phone ? (maskPhone ? this.maskPhone(inv.phone) : inv.phone) : null,
        email: inv.email
          ? maskPhone
            ? this.invitations.maskRecipient({ email: inv.email })
            : inv.email
          : null,
        inviteType: inv.tokenHash ? ('email' as const) : ('phone' as const),
        permissions: inv.permissions,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    };
  }

  async inviteManager(user: AuthUser, businessId: string, dto: InviteTeamMemberDto) {
    const business = await this.businessAccess.assertOwner(user, businessId);
    await this.planLimits.assertCanAddManager(businessId);
    validatePermissionDependencies(dto.permissions);
    const permissions = normalizeBusinessPermissions(dto.permissions);

    if (dto.email && dto.phone) {
      throw new BadRequestException('Provide either email or phone, not both');
    }
    if (dto.email) {
      return this.inviteManagerByEmail(user, business, businessId, dto.email, permissions);
    }
    if (!dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const phone = this.requirePhone(dto.phone);

    const existingUser = await this.prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      const existingMembership = await this.membership.getMembership(existingUser.id, businessId);
      if (existingMembership?.role === BusinessMembershipRole.OWNER) {
        throw new BadRequestException('Cannot invite owner as manager');
      }
      if (
        existingMembership?.role === BusinessMembershipRole.MANAGER &&
        existingMembership.status === BusinessMembershipStatus.ACTIVE
      ) {
        throw new BadRequestException('User is already an active manager');
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.businessInvitation.updateMany({
          where: {
            businessId,
            phone,
            status: BusinessInvitationStatus.PENDING,
          },
          data: { status: BusinessInvitationStatus.REVOKED },
        });

        const membership = await tx.businessMembership.upsert({
          where: { userId_businessId: { userId: existingUser.id, businessId } },
          create: {
            userId: existingUser.id,
            businessId,
            role: BusinessMembershipRole.MANAGER,
            status: BusinessMembershipStatus.ACTIVE,
            permissions,
          },
          update: {
            role: BusinessMembershipRole.MANAGER,
            status: BusinessMembershipStatus.ACTIVE,
            permissions,
          },
        });

        await this.auditLog.record({
          actor: user,
          action: AuditAction.TEAM_INVITE,
          resourceType: AuditResourceType.BUSINESS_MEMBERSHIP,
          resourceId: membership.id,
          businessId,
          cityId: business.cityId,
          targetUserId: existingUser.id,
          membershipRole: BusinessMembershipRole.OWNER,
          metadata: {
            membershipId: membership.id,
            permissionCount: permissions.length,
          },
          tx,
        });

        return { type: 'membership' as const, membershipId: membership.id };
      });
    }

    await this.prisma.businessInvitation.updateMany({
      where: {
        businessId,
        phone,
        status: BusinessInvitationStatus.PENDING,
      },
      data: { status: BusinessInvitationStatus.REVOKED },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    const invitation = await this.prisma.businessInvitation.create({
      data: {
        businessId,
        phone,
        permissions,
        invitedByUserId: user.id,
        expiresAt,
      },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.TEAM_INVITE,
      resourceType: AuditResourceType.BUSINESS_INVITATION,
      resourceId: invitation.id,
      businessId,
      cityId: business.cityId,
      membershipRole: BusinessMembershipRole.OWNER,
      metadata: {
        invitationId: invitation.id,
        phoneMasked: maskPhoneForAudit(phone),
        permissionCount: permissions.length,
      },
    });

    return { type: 'invitation' as const, invitationId: invitation.id, expiresAt };
  }

  private async inviteManagerByEmail(
    user: AuthUser,
    business: { id: string; cityId: string },
    businessId: string,
    emailRaw: string,
    permissions: BusinessPermission[],
  ) {
    const { normalized, rawToken, tokenHash, expiresAt } =
      this.invitations.createEmailInvitationParams(emailRaw);

    await this.prisma.businessInvitation.updateMany({
      where: {
        businessId,
        email: normalized,
        status: BusinessInvitationStatus.PENDING,
      },
      data: { status: BusinessInvitationStatus.REVOKED },
    });

    const invitation = await this.prisma.businessInvitation.create({
      data: {
        businessId,
        email: normalized,
        tokenHash,
        permissions,
        invitedByUserId: user.id,
        expiresAt,
      },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.TEAM_INVITE,
      resourceType: AuditResourceType.BUSINESS_INVITATION,
      resourceId: invitation.id,
      businessId,
      cityId: business.cityId,
      membershipRole: BusinessMembershipRole.OWNER,
      metadata: {
        invitationId: invitation.id,
        emailMasked: this.invitations.maskRecipient({ email: normalized }),
        permissionCount: permissions.length,
        inviteType: 'email',
      },
    });

    return {
      type: 'invitation' as const,
      invitationId: invitation.id,
      expiresAt,
      inviteUrl: this.invitations.buildInviteUrl(rawToken),
      rawToken,
    };
  }

  async updateMember(
    user: AuthUser,
    businessId: string,
    membershipId: string,
    dto: UpdateTeamMemberDto,
  ) {
    const business = await this.businessAccess.assertOwner(user, businessId);

    const membership = await this.prisma.businessMembership.findFirst({
      where: { id: membershipId, businessId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    if (membership.role === BusinessMembershipRole.OWNER) {
      throw new ForbiddenException('Cannot modify owner membership');
    }

    const data: Prisma.BusinessMembershipUpdateInput = {};
    let permissionsAdded: string[] = [];
    let permissionsRemoved: string[] = [];

    if (dto.permissions !== undefined) {
      validatePermissionDependencies(dto.permissions);
      const nextPermissions = normalizeBusinessPermissions(dto.permissions);
      const diff = permissionDiff(membership.permissions, nextPermissions);
      permissionsAdded = diff.permissionsAdded;
      permissionsRemoved = diff.permissionsRemoved;
      data.permissions = nextPermissions;
    }
    if (dto.status !== undefined) {
      if (dto.status === BusinessMembershipStatus.INVITED) {
        throw new BadRequestException('Cannot set INVITED via update');
      }
      if (membership.status === BusinessMembershipStatus.REVOKED && dto.status === BusinessMembershipStatus.ACTIVE) {
        throw new BadRequestException('Revoked manager must be re-invited');
      }
      data.status = dto.status;
    }

    const updated = await this.prisma.businessMembership.update({
      where: { id: membershipId },
      data,
    });

    const auditEntries: Array<{ action: AuditAction; metadata: Record<string, unknown> }> = [];

    if (dto.permissions !== undefined) {
      auditEntries.push({
        action: AuditAction.TEAM_PERMISSION_UPDATE,
        metadata: {
          membershipId,
          targetUserId: membership.userId,
          permissionsAdded,
          permissionsRemoved,
          permissionCountBefore: membership.permissions.length,
          permissionCountAfter: updated.permissions.length,
        },
      });
    }

    if (dto.status !== undefined && dto.status !== membership.status) {
      let action: AuditAction = AuditAction.TEAM_REVOKE;
      if (dto.status === BusinessMembershipStatus.SUSPENDED) {
        action = AuditAction.TEAM_SUSPEND;
      } else if (
        dto.status === BusinessMembershipStatus.ACTIVE &&
        membership.status === BusinessMembershipStatus.SUSPENDED
      ) {
        action = AuditAction.TEAM_RESTORE;
      } else if (dto.status === BusinessMembershipStatus.REVOKED) {
        action = AuditAction.TEAM_REVOKE;
      }
      auditEntries.push({
        action,
        metadata: {
          membershipId,
          targetUserId: membership.userId,
          oldStatus: membership.status,
          newStatus: dto.status,
        },
      });
    }

    for (const entry of auditEntries) {
      await this.auditLog.record({
        actor: user,
        action: entry.action,
        resourceType: AuditResourceType.BUSINESS_MEMBERSHIP,
        resourceId: membershipId,
        businessId,
        cityId: business.cityId,
        targetUserId: membership.userId,
        membershipRole: BusinessMembershipRole.OWNER,
        metadata: entry.metadata,
      });
    }

    return updated;
  }

  async revokeInvitation(user: AuthUser, businessId: string, invitationId: string) {
    const business = await this.businessAccess.assertOwner(user, businessId);

    const invitation = await this.prisma.businessInvitation.findFirst({
      where: { id: invitationId, businessId, status: BusinessInvitationStatus.PENDING },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const updated = await this.prisma.businessInvitation.update({
      where: { id: invitationId },
      data: { status: BusinessInvitationStatus.REVOKED },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.TEAM_REVOKE,
      resourceType: AuditResourceType.BUSINESS_INVITATION,
      resourceId: invitationId,
      businessId,
      cityId: business.cityId,
      membershipRole: BusinessMembershipRole.OWNER,
      metadata: {
        invitationId,
        phoneMasked: invitation.phone ? maskPhoneForAudit(invitation.phone) : undefined,
        emailMasked: invitation.email
          ? this.invitations.maskRecipient({ email: invitation.email })
          : undefined,
        oldStatus: BusinessInvitationStatus.PENDING,
        newStatus: BusinessInvitationStatus.REVOKED,
      },
    });

    return updated;
  }

  private async assertTeamReadAccess(user: AuthUser, businessId: string) {
    if (isGlobalAdmin(user)) {
      await this.businessAccess.resolveAccess(user, businessId);
      return;
    }
    if (user.role === UserRole.CITY_ADMIN) {
      await this.businessAccess.resolveAccess(user, businessId);
      return;
    }
    await this.businessAccess.assertOwner(user, businessId);
  }

  private requirePhone(phone: string): string {
    const normalized = normalizeKazakhstanPhone(phone);
    if (!normalized) {
      throw new BadRequestException('Invalid phone number');
    }
    return normalized;
  }

  private maskPhone(phone: string): string {
    return maskPhoneForAudit(phone);
  }
}
