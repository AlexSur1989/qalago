import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  LegalDocumentStatus,
  LegalDocumentType,
  LegalLocale,
  LegalAcceptanceSource,
  UserRole,
} from '@prisma/client';
import { LegalAcceptanceGuard } from '../../common/guards/legal-acceptance.guard';
import { LegalService } from './legal.service';
import { SafetyErrorCode } from './safety-errors';
import { AuthUser } from '../../common/types/jwt-payload.type';

function authUser(id: string, role: UserRole): AuthUser {
  return { id, sub: id, role, phone: null };
}

function mockConfig() {
  return { get: jest.fn().mockReturnValue('http://localhost:3005') } as never;
}

describe('KZ-C.2 Legal acceptance', () => {
  let prisma: {
    legalDocument: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    legalAcceptance: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
  };
  let service: LegalService;

  const termsDoc = {
    id: 'terms-1',
    type: LegalDocumentType.TERMS_OF_SERVICE,
    version: '2026-09-10',
    locale: LegalLocale.RU,
    title: 'Terms',
    content: 'stub',
    status: LegalDocumentStatus.PUBLISHED,
    effectiveAt: null,
    publishedAt: new Date(),
    requiresReacceptance: true,
  };

  const privacyDoc = {
    id: 'privacy-1',
    type: LegalDocumentType.PRIVACY_POLICY,
    version: '2026-09-10',
    locale: LegalLocale.RU,
    title: 'Privacy',
    content: 'stub',
    status: LegalDocumentStatus.PUBLISHED,
    effectiveAt: null,
    publishedAt: new Date(),
    requiresReacceptance: true,
  };

  beforeEach(() => {
    prisma = {
      legalDocument: {
        findFirst: jest.fn(async ({ where }: { where: { type: LegalDocumentType } }) => {
          if (where.type === LegalDocumentType.TERMS_OF_SERVICE) return termsDoc;
          if (where.type === LegalDocumentType.PRIVACY_POLICY) return privacyDoc;
          return null;
        }),
        findMany: jest.fn(),
        findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === termsDoc.id) return termsDoc;
          if (where.id === privacyDoc.id) return privacyDoc;
          return null;
        }),
        update: jest.fn(),
      },
      legalAcceptance: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'acc-1',
          ...data,
          acceptedAt: new Date(),
        })),
      },
    };
    service = new LegalService(prisma as never, { record: jest.fn() } as never, mockConfig());
  });

  it('returns current mandatory documents on GET legal/current shape', async () => {
    const current = await service.getLegalCurrent(LegalLocale.RU);
    expect(current.requiredDocuments).toHaveLength(2);
    expect(current.requiredDocuments[0]?.version).toBe('2026-09-10');
  });

  it('marks pending when user has no acceptance', async () => {
    const current = await service.getLegalCurrent(LegalLocale.RU, 'u1');
    expect(current.acceptanceRequired).toBe(true);
    expect(current.pendingAcceptance).toHaveLength(2);
  });

  it('rejects stale version on accept', async () => {
    try {
      await service.recordAcceptance(authUser('u1', UserRole.USER), {
        documentId: termsDoc.id,
        documentVersion: 'old',
        acceptanceSource: LegalAcceptanceSource.LOGIN,
        locale: LegalLocale.RU,
      });
      fail('expected stale version error');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toMatchObject({
        code: SafetyErrorCode.LEGAL_VERSION_STALE,
      });
    }
  });

  it('accepts current version and is idempotent', async () => {
    const first = await service.recordAcceptance(authUser('u1', UserRole.USER), {
      documentId: termsDoc.id,
      documentVersion: termsDoc.version,
      acceptanceSource: LegalAcceptanceSource.LOGIN,
      locale: LegalLocale.RU,
    });
    expect(first.documentVersion).toBe('2026-09-10');
    prisma.legalAcceptance.findFirst = jest.fn().mockResolvedValue(first);
    const second = await service.recordAcceptance(authUser('u1', UserRole.USER), {
      documentId: termsDoc.id,
      documentVersion: termsDoc.version,
      acceptanceSource: LegalAcceptanceSource.LOGIN,
      locale: LegalLocale.RU,
    });
    expect(second.id).toBe(first.id);
    expect(prisma.legalAcceptance.create).toHaveBeenCalledTimes(1);
  });

  it('preserves history when version bumps', async () => {
    prisma.legalAcceptance.findMany = jest.fn().mockResolvedValue([
      {
        documentId: termsDoc.id,
        documentVersion: '2026-01-01',
        acceptedAt: new Date('2026-01-02'),
      },
    ]);
    const pending = await service.listPendingMandatoryAcceptance('u1', LegalLocale.RU);
    expect(pending.some((p) => p.type === LegalDocumentType.TERMS_OF_SERVICE)).toBe(true);
  });

  it('staff users skip mandatory acceptance policy', () => {
    expect(service.userRequiresMandatoryLegalAcceptance(UserRole.ADMIN)).toBe(false);
    expect(service.userRequiresMandatoryLegalAcceptance(UserRole.USER)).toBe(true);
  });

  describe('LegalAcceptanceGuard', () => {
    it('blocks consumer user without acceptance', async () => {
      const guard = new LegalAcceptanceGuard(
        { getAllAndOverride: jest.fn().mockReturnValue(false) } as never,
        service,
      );
      const ctx = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: authUser('u1', UserRole.USER) }),
        }),
      } as never;
      await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows skip-decorated routes', async () => {
      const guard = new LegalAcceptanceGuard(
        {
          getAllAndOverride: jest.fn((key: string) => key === 'skipLegalAcceptance'),
        } as never,
        service,
      );
      const ctx = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: authUser('u1', UserRole.USER) }),
        }),
      } as never;
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });
  });
});
