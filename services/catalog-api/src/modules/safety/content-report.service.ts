import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentReportStatus,
  ContentReportTargetType,
  ModerationCaseStatus,
  ModerationCaseType,
  ModerationPriority,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveModerationTargetCityId } from './moderation-scope.util';
import { SafetyErrorCode } from './safety-errors';
import { MAX_REPORT_DETAILS_LENGTH } from './safety.constants';
import { SafetyRateLimitService } from './safety-rate-limit.service';

@Injectable()
export class ContentReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: SafetyRateLimitService,
  ) {}

  async createReport(
    reporter: AuthUser | null,
    ip: string,
    input: {
      targetType: ContentReportTargetType;
      targetId: string;
      reason: import('@prisma/client').ContentReportReason;
      details?: string;
    },
  ) {
    this.rateLimit.assertCanSubmitReport(ip);
    const details = input.details?.trim().slice(0, MAX_REPORT_DETAILS_LENGTH) ?? null;
    await this.assertTargetExists(input.targetType, input.targetId);

    if (reporter) {
      const existing = await this.prisma.contentReport.findFirst({
        where: {
          reporterUserId: reporter.id,
          targetType: input.targetType,
          targetId: input.targetId,
          status: { in: [ContentReportStatus.OPEN, ContentReportStatus.LINKED_TO_CASE] },
        },
      });
      if (existing) {
        throw new ConflictException({
          message: 'Report already submitted',
          code: SafetyErrorCode.REPORT_ALREADY_SUBMITTED,
        });
      }
    }

    const cityId = await resolveModerationTargetCityId(
      this.prisma,
      input.targetType,
      input.targetId,
    );

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.contentReport.create({
        data: {
          reporterUserId: reporter?.id ?? null,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          details,
        },
      });

      const moderationCase = await tx.moderationCase.create({
        data: {
          caseType: ModerationCaseType.CONTENT_REPORT,
          status: ModerationCaseStatus.OPEN,
          priority: ModerationPriority.NORMAL,
          targetType: input.targetType,
          targetId: input.targetId,
          cityId,
          targetSnapshot: { reason: input.reason },
        },
      });

      await tx.moderationCaseReport.create({
        data: { caseId: moderationCase.id, reportId: report.id },
      });

      await tx.contentReport.update({
        where: { id: report.id },
        data: { status: ContentReportStatus.LINKED_TO_CASE },
      });

      return { reportId: report.id, caseId: moderationCase.id };
    });
  }

  private async assertTargetExists(
    targetType: ContentReportTargetType,
    targetId: string,
  ): Promise<void> {
    const found = await (async () => {
      switch (targetType) {
        case ContentReportTargetType.BUSINESS:
          return this.prisma.business.findUnique({ where: { id: targetId }, select: { id: true } });
        case ContentReportTargetType.REVIEW:
          return this.prisma.review.findUnique({ where: { id: targetId }, select: { id: true } });
        case ContentReportTargetType.PROMOTION:
          return this.prisma.promotion.findUnique({ where: { id: targetId }, select: { id: true } });
        case ContentReportTargetType.MEDIA:
          return this.prisma.businessImage.findUnique({ where: { id: targetId }, select: { id: true } });
        case ContentReportTargetType.USER:
          return this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
        default:
          return null;
      }
    })();
    if (!found) {
      throw new BadRequestException({
        message: 'Target not reportable',
        code: SafetyErrorCode.CONTENT_NOT_REPORTABLE,
      });
    }
  }

  /** Admin-safe report DTO — no reporter PII. */
  toAdminReportDto(report: {
    id: string;
    targetType: ContentReportTargetType;
    targetId: string;
    reason: string;
    details: string | null;
    status: ContentReportStatus;
    createdAt: Date;
  }) {
    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt,
    };
  }
}
