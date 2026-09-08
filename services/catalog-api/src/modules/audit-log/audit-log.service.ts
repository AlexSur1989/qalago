import { ForbiddenException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessMembershipRole,
  Prisma,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_AUDIT_PAGE_LIMIT,
  MAX_AUDIT_PAGE_LIMIT,
  TEAM_AUDIT_ACTIONS,
} from './audit-log.constants';
import { ListAuditLogsQueryDto, ListTeamAuditQueryDto } from './dto/audit-log.dto';
import { sanitizeAuditMetadata, toMembershipRole } from './audit-log.util';

export type AuditRecordInput = {
  actor: AuthUser | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  businessId?: string | null;
  cityId?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, unknown> | null;
  membershipRole?: BusinessMembershipRole | null;
  tx?: Prisma.TransactionClient;
};

@Injectable()
export class AuditLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    @Inject(forwardRef(() => BusinessAccessService))
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async record(input: AuditRecordInput) {
    const client = input.tx ?? this.prisma;
    const metadata = sanitizeAuditMetadata({
      ...(input.metadata ?? {}),
      ...(input.membershipRole ? { membershipRole: input.membershipRole } : {}),
    });

    return client.auditLog.create({
      data: {
        actorUserId: input.actor?.id ?? null,
        actorRole: input.actor?.role ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        businessId: input.businessId ?? null,
        cityId: input.cityId ?? null,
        targetUserId: input.targetUserId ?? null,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async recordBusinessAction(
    user: AuthUser,
    businessId: string,
    input: Omit<
      AuditRecordInput,
      'actor' | 'businessId' | 'cityId' | 'membershipRole'
    >,
  ) {
    const access = await this.businessAccess.resolveAccess(user, businessId);
    return this.record({
      ...input,
      actor: user,
      businessId,
      cityId: access.business.cityId,
      membershipRole: toMembershipRole(access.accessRole),
    });
  }

  async listAdmin(user: AuthUser, query: ListAuditLogsQueryDto) {
    if (!isGlobalAdmin(user) && user.role !== UserRole.CITY_ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? DEFAULT_AUDIT_PAGE_LIMIT, MAX_AUDIT_PAGE_LIMIT);
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    const managedCityId =
      user.role === UserRole.CITY_ADMIN
        ? await this.cityScope.resolveAdminCityId(user)
        : undefined;

    if (managedCityId) {
      where.cityId = managedCityId;
    }

    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.businessId) where.businessId = query.businessId;

    if (query.cityId) {
      if (managedCityId && query.cityId !== managedCityId) {
        throw new ForbiddenException('Cannot query audit logs outside managed city');
      }
      where.cityId = query.cityId;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, phone: true, role: true } },
          business: { select: { id: true, title: true } },
          city: { select: { id: true, slug: true, nameRu: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async listTeamHistory(user: AuthUser, businessId: string, query: ListTeamAuditQueryDto) {
    await this.businessAccess.assertOwner(user, businessId);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { cityId: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? DEFAULT_AUDIT_PAGE_LIMIT, MAX_AUDIT_PAGE_LIMIT);
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      businessId,
      action: { in: TEAM_AUDIT_ACTIONS },
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, phone: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }
}
