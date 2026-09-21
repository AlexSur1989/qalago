import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  ContentReportReason,
  ContentReportStatus,
  ContentReportTargetType,
  ModerationActionType,
  UserRole,
} from '@prisma/client';
import { publicReviewWhere } from '../../common/constants/review.constants';
import { ReviewAggregationService } from '../../common/services/review-aggregation.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { ContentReportService } from './content-report.service';
import { ModerationService } from './moderation.service';
import { SafetyErrorCode } from './safety-errors';

function authUser(id: string, role: UserRole): AuthUser {
  return { id, sub: id, role, phone: null };
}

describe('Stage 6.11D.3 review moderation', () => {
  describe('ContentReportService REVIEW targets', () => {
    let service: ContentReportService;
    let prisma: {
      review: { findUnique: jest.Mock };
      business: { findUnique: jest.Mock };
      promotion: { findUnique: jest.Mock };
      businessImage: { findUnique: jest.Mock };
      user: { findUnique: jest.Mock };
      contentReport: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
      moderationCase: { create: jest.Mock };
      moderationCaseReport: { create: jest.Mock };
      $transaction: jest.Mock;
    };

    beforeEach(() => {
      prisma = {
        business: { findUnique: jest.fn() },
        review: { findUnique: jest.fn() },
        promotion: { findUnique: jest.fn() },
        businessImage: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
        contentReport: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
        },
        moderationCase: { create: jest.fn().mockResolvedValue({ id: 'case-1' }) },
        moderationCaseReport: { create: jest.fn() },
        $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
          fn({
            contentReport: {
              create: jest.fn().mockResolvedValue({ id: 'rep-1' }),
              update: jest.fn(),
            },
            moderationCase: { create: jest.fn().mockResolvedValue({ id: 'case-1' }) },
            moderationCaseReport: { create: jest.fn() },
          }),
        ),
      };
      service = new ContentReportService(
        prisma as never,
        { assertCanSubmitReport: jest.fn() } as never,
      );
    });

    it('A accepts active review report', async () => {
      prisma.review.findUnique = jest.fn().mockResolvedValue({
        id: 'rev-1',
        deletedAt: null,
        business: { cityId: 'city-1' },
      });
      const result = await service.createReport(authUser('u1', UserRole.USER), '1.1.1.1', {
        targetType: ContentReportTargetType.REVIEW,
        targetId: 'rev-1',
        reason: ContentReportReason.SPAM,
      });
      expect(result.caseId).toBe('case-1');
    });

    it('B rejects missing review', async () => {
      prisma.review.findUnique = jest.fn().mockResolvedValue(null);
      await expect(
        service.createReport(authUser('u1', UserRole.USER), '1.1.1.1', {
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'missing',
          reason: ContentReportReason.SPAM,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('C rejects soft-deleted review for new consumer report', async () => {
      prisma.review.findUnique = jest.fn().mockResolvedValue({
        id: 'rev-1',
        deletedAt: new Date(),
        business: { cityId: 'city-1' },
      });
      await expect(
        service.createReport(authUser('u1', UserRole.USER), '1.1.1.1', {
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          reason: ContentReportReason.SPAM,
        }),
      ).rejects.toMatchObject({
        response: { code: SafetyErrorCode.CONTENT_NOT_REPORTABLE },
      });
    });

    it('D allows report on moderation-hidden but not deleted review', async () => {
      prisma.review.findUnique = jest.fn().mockResolvedValue({
        id: 'rev-1',
        deletedAt: null,
        business: { cityId: 'city-1' },
      });
      await expect(
        service.createReport(authUser('u1', UserRole.USER), '1.1.1.1', {
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          reason: ContentReportReason.OTHER,
        }),
      ).resolves.toBeDefined();
    });

    it('E dedupes open report by same reporter', async () => {
      prisma.review.findUnique = jest.fn().mockResolvedValue({
        id: 'rev-1',
        deletedAt: null,
        business: { cityId: 'city-1' },
      });
      prisma.contentReport.findFirst = jest.fn().mockResolvedValue({ id: 'dup' });
      await expect(
        service.createReport(authUser('u1', UserRole.USER), '1.1.1.1', {
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          reason: ContentReportReason.SPAM,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('ModerationService case detail & actions', () => {
    let prisma: Record<string, unknown>;
    let cityScope: { assertBusinessInAdminScope: jest.Mock };
    let auditLog: { record: jest.Mock };
    let service: ModerationService;

    beforeEach(() => {
      auditLog = { record: jest.fn() };
      cityScope = { assertBusinessInAdminScope: jest.fn() };
      prisma = {
        moderationCase: { findUnique: jest.fn() },
        moderationCaseReport: { findMany: jest.fn().mockResolvedValue([]) },
        moderationAction: { findMany: jest.fn().mockResolvedValue([]) },
        city: { findUnique: jest.fn() },
        review: { findUnique: jest.fn() },
        $transaction: jest.fn(),
      };
      service = new ModerationService(
        prisma as never,
        cityScope as never,
        auditLog as never,
        { revokeAllUserSessions: jest.fn() } as never,
        {} as never,
        { create: jest.fn() } as never,
      );
    });

    it('G–K getCaseDetail includes reports, actions, review target, missing safe', async () => {
      (prisma.moderationCase as { findUnique: jest.Mock }).findUnique = jest
        .fn()
        .mockResolvedValue({
          id: 'case-1',
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          cityId: 'city-1',
          targetSnapshot: { reason: ContentReportReason.SPAM },
        });
      (prisma.moderationCaseReport as { findMany: jest.Mock }).findMany = jest
        .fn()
        .mockResolvedValue([
          {
            report: {
              id: 'rep-1',
              targetType: ContentReportTargetType.REVIEW,
              targetId: 'rev-1',
              reason: ContentReportReason.SPAM,
              details: 'bad',
              status: ContentReportStatus.LINKED_TO_CASE,
              createdAt: new Date(),
              updatedAt: new Date(),
              reporter: { id: 'u2', name: 'Reporter', phone: null },
            },
          },
        ]);
      (prisma.moderationAction as { findMany: jest.Mock }).findMany = jest
        .fn()
        .mockResolvedValue([
          {
            id: 'act-1',
            actionType: ModerationActionType.REVIEW_HIDE,
            internalNote: 'hide',
            createdAt: new Date(),
            actorAdmin: { id: 'mod', name: 'Mod', role: UserRole.MODERATOR },
          },
        ]);
      (prisma.city as { findUnique: jest.Mock }).findUnique = jest
        .fn()
        .mockResolvedValue({ id: 'city-1', slug: 'uralsk', nameRu: 'Уральск' });
      (prisma.review as { findUnique: jest.Mock }).findUnique = jest
        .fn()
        .mockResolvedValue(null);

      const detail = await service.getCaseDetail(authUser('mod', UserRole.MODERATOR), 'case-1');
      expect(detail.reports).toHaveLength(1);
      expect(detail.actions).toHaveLength(1);
      expect(detail.reviewTarget?.state).toBe('MISSING');
    });

    it('L city admin outside scope forbidden on view', async () => {
      (prisma.moderationCase as { findUnique: jest.Mock }).findUnique = jest
        .fn()
        .mockResolvedValue({
          id: 'case-1',
          cityId: 'other-city',
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
        });
      cityScope.assertBusinessInAdminScope = jest
        .fn()
        .mockRejectedValue(new ForbiddenException('out of scope'));
      await expect(
        service.getCaseDetail(authUser('ca', UserRole.CITY_ADMIN), 'case-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('N applyAction requires note for REVIEW_HIDE', async () => {
      (prisma.moderationCase as { findUnique: jest.Mock }).findUnique = jest
        .fn()
        .mockResolvedValue({
          id: 'case-1',
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          cityId: 'city-1',
          targetSnapshot: {},
        });
      await expect(
        service.applyAction(authUser('mod', UserRole.MODERATOR), 'case-1', {
          actionType: ModerationActionType.REVIEW_HIDE,
        }),
      ).rejects.toMatchObject({
        response: { code: SafetyErrorCode.MODERATION_NOTE_REQUIRED },
      });
    });

    it('Q–T REVIEW_HIDE sets moderationHidden and writes audit', async () => {
      (prisma.moderationCase as { findUnique: jest.Mock }).findUnique = jest
        .fn()
        .mockResolvedValue({
          id: 'case-1',
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          cityId: 'city-1',
          targetSnapshot: {},
        });
      const reviewUpdate = jest.fn();
      (prisma.$transaction as jest.Mock) = jest.fn(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          moderationAction: { create: jest.fn() },
          moderationCase: { update: jest.fn() },
          review: {
            findUnique: jest.fn().mockResolvedValue({ id: 'rev-1' }),
            update: reviewUpdate,
          },
        };
        return fn(tx);
      });

      await service.applyAction(authUser('mod', UserRole.MODERATOR), 'case-1', {
        actionType: ModerationActionType.REVIEW_HIDE,
        internalNote: 'policy violation',
      });

      expect(reviewUpdate).toHaveBeenCalledWith({
        where: { id: 'rev-1' },
        data: { moderationHidden: true },
      });
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.MODERATION_ACTION_APPLY }),
      );
    });

    it('U–V REVIEW_RESTORE clears moderationHidden only', async () => {
      (prisma.moderationCase as { findUnique: jest.Mock }).findUnique = jest
        .fn()
        .mockResolvedValue({
          id: 'case-1',
          targetType: ContentReportTargetType.REVIEW,
          targetId: 'rev-1',
          cityId: 'city-1',
          targetSnapshot: {},
        });
      const reviewUpdate = jest.fn();
      (prisma.$transaction as jest.Mock) = jest.fn(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          moderationAction: { create: jest.fn() },
          moderationCase: { update: jest.fn() },
          review: {
            findUnique: jest
              .fn()
              .mockResolvedValue({ id: 'rev-1', deletedAt: new Date() }),
            update: reviewUpdate,
          },
        };
        return fn(tx);
      });

      await service.applyAction(authUser('mod', UserRole.MODERATOR), 'case-1', {
        actionType: ModerationActionType.REVIEW_RESTORE,
        internalNote: 'false positive',
      });

      expect(reviewUpdate).toHaveBeenCalledWith({
        where: { id: 'rev-1' },
        data: { moderationHidden: false },
      });
      const payload = reviewUpdate.mock.calls[0][0].data;
      expect(payload).not.toHaveProperty('deletedAt');
    });

    it('M missing case is 404', async () => {
      (prisma.moderationCase as { findUnique: jest.Mock }).findUnique = jest
        .fn()
        .mockResolvedValue(null);
      await expect(
        service.getCaseDetail(authUser('mod', UserRole.MODERATOR), 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Rating regression predicate', () => {
    it('X–Y hidden and deleted reviews excluded from publicReviewWhere', () => {
      expect(publicReviewWhere()).toEqual({
        moderationHidden: false,
        deletedAt: null,
      });
    });

    it('aggregation service uses public predicate', async () => {
      const prisma = {
        review: {
          groupBy: jest.fn().mockResolvedValue([]),
        },
      };
      const agg = new ReviewAggregationService(prisma as never);
      await agg.aggregateForBusiness('b1');
      expect(prisma.review.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(publicReviewWhere()),
        }),
      );
    });
  });
});
