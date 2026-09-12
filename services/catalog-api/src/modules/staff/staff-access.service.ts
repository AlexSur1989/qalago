import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import { SystemAccessService } from '../../common/services/system-access.service';
import {
  ASSIGNABLE_STAFF_ROLES,
  StaffPermission,
  canActorAssignStaffRole,
  isStaffRole,
} from '../../common/utils/staff-access.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthSessionService } from '../auth/auth-session.service';
import {
  CreateStaffAccessDto,
  SetStaffCityScopesDto,
  UpdateStaffRoleDto,
} from './dto/staff.dto';

@Injectable()
export class StaffAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: StaffPolicyService,
    private readonly systemAccess: SystemAccessService,
    private readonly auditLog: AuditLogService,
    private readonly authSession: AuthSessionService,
  ) {}

  async listStaff(_actor: AuthUser) {
    const rows = await this.prisma.staffAccess.findMany({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            managedCityId: true,
            authSessions: {
              where: { revokedAt: null, expiresAt: { gt: new Date() } },
              select: { id: true },
            },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const cityScopesByUser = await this.loadCityScopesByUser(rows.map((r) => r.userId));

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      staffRole: row.staffRole,
      isActive: row.isActive,
      disabledAt: row.disabledAt,
      mfaEnrolledAt: row.mfaEnrolledAt,
      mfaRequired: row.mfaRequired,
      createdAt: row.createdAt,
      createdBy: row.createdBy,
      user: {
        id: row.user.id,
        phone: row.user.phone,
        name: row.user.name,
        createdAt: row.user.createdAt,
      },
      cityScopes: cityScopesByUser.get(row.userId) ?? [],
      activeSessionCount: row.user.authSessions.length,
    }));
  }

  async getStaffOverview(_actor: AuthUser) {
    const [total, active, disabled, byRole, recentLogins] = await Promise.all([
      this.prisma.staffAccess.count(),
      this.prisma.staffAccess.count({ where: { isActive: true } }),
      this.prisma.staffAccess.count({ where: { isActive: false } }),
      this.prisma.staffAccess.groupBy({
        by: ['staffRole'],
        _count: { _all: true },
      }),
      this.prisma.staffAccess.findMany({
        where: { isActive: true },
        select: { userId: true, lastStaffLoginAt: true, staffRole: true },
        orderBy: { lastStaffLoginAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      total,
      active,
      disabled,
      rolesDistribution: byRole.map((r) => ({
        role: r.staffRole,
        count: r._count._all,
      })),
      recentLogins,
    };
  }

  async getStaffDetail(actor: AuthUser, userId: string) {
    await this.getStaffRow(userId);
    const audits = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          { resourceType: AuditResourceType.STAFF_ACCESS, resourceId: userId },
        ],
        action: {
          in: [
            AuditAction.STAFF_CREATED,
            AuditAction.STAFF_DISABLED,
            AuditAction.STAFF_RESTORED,
            AuditAction.STAFF_ROLE_CHANGED,
            AuditAction.STAFF_CITY_SCOPE_CHANGED,
            AuditAction.STAFF_SESSION_REVOKED,
            AuditAction.SUPER_ADMIN_ASSIGNED,
            AuditAction.ADMIN_ASSIGNED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const row = await this.prisma.staffAccess.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            createdAt: true,
            authSessions: {
              where: { revokedAt: null, expiresAt: { gt: new Date() } },
              select: {
                id: true,
                createdAt: true,
                lastUsedAt: true,
                userAgent: true,
              },
            },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!row) throw new NotFoundException('Staff not found');
    const cityScopes = await this.prisma.staffCityScope.findMany({
      where: { userId },
      include: { city: { select: { id: true, slug: true, nameRu: true } } },
    });
    return {
      staff: { ...row, cityScopes: cityScopes.map((s) => s.city) },
      auditHistory: audits,
    };
  }

  async createStaff(actor: AuthUser, dto: CreateStaffAccessDto) {
    this.policy.assertPermission(actor, StaffPermission.STAFF_CREATE);
    this.policy.assertPermission(actor, StaffPermission.STAFF_ROLE_ASSIGN);

    const targetRole = dto.staffRole;
    if (!canActorAssignStaffRole(actor.role as UserRole, targetRole)) {
      throw new ForbiddenException('Cannot assign this staff role');
    }

    if (targetRole === UserRole.CITY_ADMIN && !dto.cityIds?.length && !dto.managedCityId) {
      throw new BadRequestException('City scope required for CITY_ADMIN');
    }

    const user = await this.resolveOrCreateStaffUser(dto);

    const existing = await this.prisma.staffAccess.findUnique({
      where: { userId: user.id },
    });
    if (existing?.isActive) {
      throw new BadRequestException('User already has active staff access');
    }

    const cityIds = await this.resolveCityIds(dto);

    return this.prisma.$transaction(async (tx) => {
      await tx.staffAccess.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          staffRole: targetRole,
          isActive: true,
          createdByUserId: actor.id,
        },
        update: {
          staffRole: targetRole,
          isActive: true,
          disabledAt: null,
          createdByUserId: actor.id,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          role: targetRole,
          isActive: true,
          managedCityId:
            targetRole === UserRole.CITY_ADMIN ? (cityIds[0] ?? null) : null,
        },
      });

      if (targetRole === UserRole.CITY_ADMIN) {
        await tx.staffCityScope.deleteMany({ where: { userId: user.id } });
        for (const cityId of cityIds) {
          await tx.staffCityScope.create({
            data: { userId: user.id, cityId },
          });
        }
      }

      const action =
        targetRole === UserRole.SUPER_ADMIN
          ? AuditAction.SUPER_ADMIN_ASSIGNED
          : targetRole === UserRole.ADMIN
            ? AuditAction.ADMIN_ASSIGNED
            : AuditAction.STAFF_CREATED;

      await this.auditLog.record({
        actor,
        action,
        resourceType: AuditResourceType.STAFF_ACCESS,
        resourceId: user.id,
        targetUserId: user.id,
        metadata: { staffRole: targetRole, cityIds },
        tx,
      });

      return { userId: user.id, staffRole: targetRole };
    });
  }

  async updateStaffRole(actor: AuthUser, userId: string, dto: UpdateStaffRoleDto) {
    this.policy.assertPermission(actor, StaffPermission.STAFF_ROLE_ASSIGN);
    this.policy.assertNoSelfTarget(actor.id, userId, 'change role');

    if (!canActorAssignStaffRole(actor.role as UserRole, dto.staffRole)) {
      throw new ForbiddenException('Cannot assign this staff role');
    }

    const row = await this.getStaffRow(userId);
    const oldRole = row.staffRole;

    if (oldRole === UserRole.SUPER_ADMIN && dto.staffRole !== UserRole.SUPER_ADMIN) {
      await this.systemAccess.assertCanDemoteSuperAdmin(userId);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.staffAccess.update({
        where: { userId },
        data: { staffRole: dto.staffRole },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          role: dto.staffRole,
          managedCityId:
            dto.staffRole === UserRole.CITY_ADMIN ? row.user.managedCityId : null,
        },
      });

      await this.auditLog.record({
        actor,
        action: AuditAction.STAFF_ROLE_CHANGED,
        resourceType: AuditResourceType.STAFF_ACCESS,
        resourceId: userId,
        targetUserId: userId,
        metadata: { oldRole, newRole: dto.staffRole },
        tx,
      });
    });
  }

  async setCityScopes(actor: AuthUser, userId: string, dto: SetStaffCityScopesDto) {
    this.policy.assertPermission(actor, StaffPermission.STAFF_CITY_SCOPE_ASSIGN);
    this.policy.assertNoSelfTarget(actor.id, userId, 'change city scope');

    const row = await this.getStaffRow(userId);
    if (row.staffRole !== UserRole.CITY_ADMIN) {
      throw new BadRequestException('City scopes apply only to CITY_ADMIN');
    }

    const cityIds = await this.resolveCityIds({ cityIds: dto.cityIds });

    return this.prisma.$transaction(async (tx) => {
      await tx.staffCityScope.deleteMany({ where: { userId } });
      for (const cityId of cityIds) {
        await tx.staffCityScope.create({ data: { userId, cityId } });
      }
      await tx.user.update({
        where: { id: userId },
        data: { managedCityId: cityIds[0] ?? null },
      });

      await this.auditLog.record({
        actor,
        action: AuditAction.STAFF_CITY_SCOPE_CHANGED,
        resourceType: AuditResourceType.STAFF_ACCESS,
        resourceId: userId,
        targetUserId: userId,
        metadata: { cityIds },
        tx,
      });
    });
  }

  async disableStaff(actor: AuthUser, userId: string) {
    this.policy.assertPermission(actor, StaffPermission.STAFF_DISABLE);
    this.policy.assertNoSelfTarget(actor.id, userId, 'disable');

    const row = await this.getStaffRow(userId);
    if (!row.isActive) {
      return { alreadyDisabled: true };
    }

    if (row.staffRole === UserRole.SUPER_ADMIN) {
      await this.systemAccess.assertCanDemoteSuperAdmin(userId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.staffAccess.update({
        where: { userId },
        data: { isActive: false, disabledAt: new Date() },
      });
      await tx.user.update({
        where: { id: userId },
        data: { role: UserRole.USER, managedCityId: null },
      });
      await tx.staffCityScope.deleteMany({ where: { userId } });
      await this.auditLog.record({
        actor,
        action: AuditAction.STAFF_DISABLED,
        resourceType: AuditResourceType.STAFF_ACCESS,
        resourceId: userId,
        targetUserId: userId,
        tx,
      });
    });

    await this.authSession.revokeAllUserSessions(userId);
    return { disabled: true };
  }

  async restoreStaff(actor: AuthUser, userId: string) {
    this.policy.assertPermission(actor, StaffPermission.STAFF_UPDATE);
    this.policy.assertNoSelfTarget(actor.id, userId, 'restore');

    const row = await this.prisma.staffAccess.findUnique({ where: { userId } });
    if (!row) throw new NotFoundException('Staff not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.staffAccess.update({
        where: { userId },
        data: { isActive: true, disabledAt: null },
      });
      await tx.user.update({
        where: { id: userId },
        data: { role: row.staffRole, isActive: true },
      });
      await this.auditLog.record({
        actor,
        action: AuditAction.STAFF_RESTORED,
        resourceType: AuditResourceType.STAFF_ACCESS,
        resourceId: userId,
        targetUserId: userId,
        tx,
      });
    });
    return { restored: true };
  }

  async revokeAllSessions(actor: AuthUser, userId: string) {
    this.policy.assertPermission(actor, StaffPermission.STAFF_SESSION_REVOKE);
    await this.getStaffRow(userId);
    await this.authSession.revokeAllUserSessions(userId);
    await this.auditLog.record({
      actor,
      action: AuditAction.STAFF_SESSION_REVOKED,
      resourceType: AuditResourceType.STAFF_ACCESS,
      resourceId: userId,
      targetUserId: userId,
      metadata: { scope: 'all' },
    });
    return { revoked: true };
  }

  async revokeSession(actor: AuthUser, userId: string, sessionId: string) {
    this.policy.assertPermission(actor, StaffPermission.STAFF_SESSION_REVOKE);
    await this.getStaffRow(userId);
    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    await this.auditLog.record({
      actor,
      action: AuditAction.STAFF_SESSION_REVOKED,
      resourceType: AuditResourceType.AUTH_SESSION,
      resourceId: sessionId,
      targetUserId: userId,
    });
    return { revoked: true };
  }

  private async getStaffRow(userId: string) {
    const row = await this.prisma.staffAccess.findUnique({
      where: { userId },
      include: { user: { select: { managedCityId: true } } },
    });
    if (!row) throw new NotFoundException('Staff not found');
    return row;
  }

  private async resolveOrCreateStaffUser(dto: CreateStaffAccessDto) {
    if (dto.userId) {
      const u = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!u) throw new NotFoundException('User not found');
      return u;
    }
    if (!dto.phone?.trim()) {
      throw new BadRequestException('userId or phone required');
    }
    const phone = dto.phone.trim();
    let u = await this.prisma.user.findUnique({ where: { phone } });
    if (!u) {
      u = await this.prisma.user.create({
        data: { phone, name: dto.name?.trim() || 'Staff', role: UserRole.USER },
      });
    }
    return u;
  }

  private async resolveCityIds(input: {
    cityIds?: string[];
    managedCityId?: string;
  }): Promise<string[]> {
    const ids = [...(input.cityIds ?? [])];
    if (input.managedCityId) ids.push(input.managedCityId);
    const unique = [...new Set(ids.filter(Boolean))];
    for (const cityId of unique) {
      const city = await this.prisma.city.findUnique({ where: { id: cityId } });
      if (!city) throw new BadRequestException(`City not found: ${cityId}`);
    }
    return unique;
  }

  static isAssignableRole(role: UserRole): boolean {
    return (
      role === UserRole.SUPER_ADMIN || ASSIGNABLE_STAFF_ROLES.includes(role)
    );
  }

  private async loadCityScopesByUser(userIds: string[]) {
    const scopes = await this.prisma.staffCityScope.findMany({
      where: { userId: { in: userIds } },
      include: { city: { select: { id: true, slug: true, nameRu: true } } },
    });
    const map = new Map<string, { id: string; slug: string; nameRu: string }[]>();
    for (const s of scopes) {
      const list = map.get(s.userId) ?? [];
      list.push(s.city);
      map.set(s.userId, list);
    }
    return map;
  }
}
