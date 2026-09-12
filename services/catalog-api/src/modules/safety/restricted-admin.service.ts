import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  GovernmentRequestStatus,
  SecurityIncidentSeverity,
  SecurityIncidentStatus,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class RestrictedAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private assertSuperAdmin(user: AuthUser) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('SUPER_ADMIN required');
    }
  }

  listGovernmentRequests(user: AuthUser) {
    this.assertSuperAdmin(user);
    return this.prisma.governmentRequest.findMany({
      orderBy: { receivedAt: 'desc' },
      take: 50,
    });
  }

  async updateGovernmentRequest(
    user: AuthUser,
    id: string,
    data: { status?: GovernmentRequestStatus; responseSummary?: string },
  ) {
    this.assertSuperAdmin(user);
    const row = await this.prisma.governmentRequest.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.responseSummary !== undefined
          ? { responseSummary: data.responseSummary?.slice(0, 4000) ?? null }
          : {}),
      },
    });
    await this.auditLog.record({
      actor: user,
      action: AuditAction.GOVERNMENT_REQUEST_UPDATE,
      resourceType: AuditResourceType.GOVERNMENT_REQUEST,
      resourceId: row.id,
      metadata: { status: row.status },
    });
    return row;
  }

  listSecurityIncidents(user: AuthUser) {
    this.assertSuperAdmin(user);
    return this.prisma.securityIncident.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 50,
    });
  }

  async createSecurityIncident(
    user: AuthUser,
    input: { severity: SecurityIncidentSeverity; title: string; summary?: string },
  ) {
    this.assertSuperAdmin(user);
    const row = await this.prisma.securityIncident.create({
      data: {
        severity: input.severity,
        title: input.title.slice(0, 200),
        summary: input.summary?.slice(0, 4000) ?? null,
        ownerAdminId: user.id,
      },
    });
    await this.auditLog.record({
      actor: user,
      action: AuditAction.SECURITY_INCIDENT_UPDATE,
      resourceType: AuditResourceType.SECURITY_INCIDENT,
      resourceId: row.id,
      metadata: { severity: row.severity, status: row.status },
    });
    return row;
  }

  async updateSecurityIncident(
    user: AuthUser,
    id: string,
    data: { status?: SecurityIncidentStatus; summary?: string },
  ) {
    this.assertSuperAdmin(user);
    const row = await this.prisma.securityIncident.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.summary !== undefined ? { summary: data.summary?.slice(0, 4000) ?? null } : {}),
        ...(data.status === SecurityIncidentStatus.CONTAINED ? { containedAt: new Date() } : {}),
        ...(data.status === SecurityIncidentStatus.RESOLVED ? { resolvedAt: new Date() } : {}),
      },
    });
    await this.auditLog.record({
      actor: user,
      action: AuditAction.SECURITY_INCIDENT_UPDATE,
      resourceType: AuditResourceType.SECURITY_INCIDENT,
      resourceId: row.id,
      metadata: { status: row.status },
    });
    return row;
  }
}
