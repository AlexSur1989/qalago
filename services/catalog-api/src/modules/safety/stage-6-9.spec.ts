import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentReportStatus,
  ContentReportTargetType,
  ContentReportReason,
  DataRightsRequestType,
  LegalDocumentStatus,
  LegalDocumentType,
  LegalLocale,
  LegalAcceptanceSource,
  ModerationActionType,
  UserRole,
} from '@prisma/client';
import { LegalService } from './legal.service';
import { ContentReportService } from './content-report.service';
import { DataRightsService } from './data-rights.service';
import { ModerationService } from './moderation.service';
import { RestrictedAdminService } from './restricted-admin.service';
import { SafetyErrorCode } from './safety-errors';
import { AuthUser } from '../../common/types/jwt-payload.type';

function authUser(id: string, role: UserRole): AuthUser {
  return { id, sub: id, role, phone: null };
}

describe('Stage 6.9 Legal & Safety', () => {
  describe('LegalService', () => {
    let prisma: {
      legalDocument: { findFirst: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
      legalAcceptance: { findMany: jest.Mock; create: jest.Mock };
    };
    let auditLog: { record: jest.Mock };
    let service: LegalService;

    beforeEach(() => {
      auditLog = { record: jest.fn() };
      prisma = {
        legalDocument: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        legalAcceptance: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
        },
      };
      service = new LegalService(prisma as never, auditLog as never);
    });

    it('A guest can read published legal document', async () => {
      prisma.legalDocument.findFirst = jest.fn().mockResolvedValue({
        id: 'd1',
        type: LegalDocumentType.PRIVACY_POLICY,
        version: '1.0',
        locale: LegalLocale.RU,
        title: 'Privacy',
        content: 'DRAFT — LEGAL_REVIEW_REQUIRED',
        effectiveAt: null,
        publishedAt: new Date(),
        requiresReacceptance: false,
      });
      const doc = await service.getPublishedDocument(
        LegalDocumentType.PRIVACY_POLICY,
        LegalLocale.RU,
      );
      expect(doc.version).toBe('1.0');
    });

    it('B guest cannot read draft (404)', async () => {
      prisma.legalDocument.findFirst = jest.fn().mockResolvedValue(null);
      await expect(
        service.getPublishedDocument(LegalDocumentType.PRIVACY_POLICY, LegalLocale.RU),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('G CITY_ADMIN cannot publish global legal docs', async () => {
      await expect(
        service.publishDocument(
          authUser('ca1', UserRole.CITY_ADMIN),
          'd1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('ContentReportService', () => {
    let service: ContentReportService;
    let prisma: {
      business: { findUnique: jest.Mock };
      review: { findUnique: jest.Mock };
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
        business: { findUnique: jest.fn().mockResolvedValue({ id: 'b1' }) },
        review: { findUnique: jest.fn() },
        promotion: { findUnique: jest.fn() },
        businessImage: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
        contentReport: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
        },
        moderationCase: { create: jest.fn().mockResolvedValue({ id: 'c1' }) },
        moderationCaseReport: { create: jest.fn() },
        $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
          fn({
            contentReport: {
              create: jest.fn().mockResolvedValue({ id: 'r1' }),
              update: jest.fn(),
            },
            moderationCase: { create: jest.fn().mockResolvedValue({ id: 'c1' }) },
            moderationCaseReport: { create: jest.fn() },
          }),
        ),
      };
      service = new ContentReportService(
        prisma as never,
        { assertCanSubmitReport: jest.fn() } as never,
      );
    });

    it('P reports valid business', async () => {
      const result = await service.createReport(
        authUser('u1', UserRole.USER),
        '127.0.0.1',
        {
          targetType: ContentReportTargetType.BUSINESS,
          targetId: 'b1',
          reason: ContentReportReason.SPAM,
        },
      );
      expect(result.caseId).toBe('c1');
    });

    it('S dedupes active report from same reporter', async () => {
      prisma.contentReport.findFirst = jest.fn().mockResolvedValue({ id: 'existing' });
      await expect(
        service.createReport(
          authUser('u1', UserRole.USER),
          '127.0.0.1',
          {
            targetType: ContentReportTargetType.BUSINESS,
            targetId: 'b1',
            reason: ContentReportReason.SPAM,
          },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('U admin report dto omits reporter identity', () => {
      const dto = service.toAdminReportDto({
        id: 'r1',
        targetType: ContentReportTargetType.BUSINESS,
        targetId: 'b1',
        reason: ContentReportReason.SPAM,
        details: 'text',
        status: ContentReportStatus.OPEN,
        createdAt: new Date(),
      });
      expect(dto).not.toHaveProperty('reporterUserId');
    });
  });

  describe('DataRightsService', () => {
    it('H user creates own request', async () => {
      const prisma = {
        dataRightsRequest: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'dr1', type: DataRightsRequestType.EXPORT }),
        },
      };
      const service = new DataRightsService(
        prisma as never,
        { assertCanSubmitDataRights: jest.fn() } as never,
        { record: jest.fn() } as never,
      );
      const row = await service.createRequest(
        authUser('u1', UserRole.USER),
        DataRightsRequestType.EXPORT,
      );
      expect(row.id).toBe('dr1');
    });

    it('J duplicate active deletion request blocked', async () => {
      const prisma = {
        dataRightsRequest: {
          findFirst: jest.fn().mockResolvedValue({ id: 'existing' }),
        },
      };
      const service = new DataRightsService(
        prisma as never,
        { assertCanSubmitDataRights: jest.fn() } as never,
        { record: jest.fn() } as never,
      );
      await expect(
        service.createRequest(
          authUser('u1', UserRole.USER),
          DataRightsRequestType.DELETE_ACCOUNT,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('RestrictedAdminService', () => {
    it('AO CITY_ADMIN denied government requests', () => {
      const service = new RestrictedAdminService({} as never, { record: jest.fn() } as never);
      expect(() =>
        service.listGovernmentRequests(authUser('ca', UserRole.CITY_ADMIN)),
      ).toThrow(ForbiddenException);
    });

    it('AT CITY_ADMIN denied security incidents', () => {
      const service = new RestrictedAdminService({} as never, { record: jest.fn() } as never);
      expect(() =>
        service.listSecurityIncidents(authUser('ca', UserRole.CITY_ADMIN)),
      ).toThrow(ForbiddenException);
    });
  });
});
