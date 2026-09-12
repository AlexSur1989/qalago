import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  DataRightsRequestStatus,
  DataRightsRequestType,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SafetyErrorCode } from './safety-errors';
import { SafetyRateLimitService } from './safety-rate-limit.service';

const ACTIVE_STATUSES: DataRightsRequestStatus[] = [
  DataRightsRequestStatus.SUBMITTED,
  DataRightsRequestStatus.IDENTITY_VERIFICATION_REQUIRED,
  DataRightsRequestStatus.IN_REVIEW,
  DataRightsRequestStatus.APPROVED,
  DataRightsRequestStatus.PROCESSING,
];

@Injectable()
export class DataRightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: SafetyRateLimitService,
    private readonly auditLog: AuditLogService,
  ) {}

  async createRequest(user: AuthUser, type: DataRightsRequestType) {
    this.rateLimit.assertCanSubmitDataRights(user.id);
    const existing = await this.prisma.dataRightsRequest.findFirst({
      where: { userId: user.id, type, status: { in: ACTIVE_STATUSES } },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Active request already exists',
        code: SafetyErrorCode.DATA_REQUEST_ALREADY_ACTIVE,
      });
    }

    return this.prisma.dataRightsRequest.create({
      data: { userId: user.id, type },
    });
  }

  listMine(userId: string) {
    return this.prisma.dataRightsRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        requestedAt: true,
        completedAt: true,
        rejectedAt: true,
      },
    });
  }

  async updateStatus(actor: AuthUser, requestId: string, status: DataRightsRequestStatus) {
    if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Insufficient role');
    }
    const row = await this.prisma.dataRightsRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === DataRightsRequestStatus.COMPLETED ? { completedAt: new Date() } : {}),
        ...(status === DataRightsRequestStatus.REJECTED ? { rejectedAt: new Date() } : {}),
      },
    });
    await this.auditLog.record({
      actor,
      action: AuditAction.DATA_REQUEST_STATUS_CHANGE,
      resourceType: AuditResourceType.DATA_RIGHTS_REQUEST,
      resourceId: row.id,
      targetUserId: row.userId,
      metadata: { status },
    });

    return row;
  }

  assertOwner(userId: string, requestUserId: string) {
    if (userId !== requestUserId) {
      throw new ForbiddenException('Not allowed');
    }
  }
}
