import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  LegalDocumentStatus,
  LegalDocumentType,
  LegalLocale,
  LegalAcceptanceSource,
  UserRole,
} from '@prisma/client';
import { LegalService } from './legal.service';
import { SafetyErrorCode } from './safety-errors';
import { AuthUser } from '../../common/types/jwt-payload.type';

function authUser(id: string, role: UserRole = UserRole.USER): AuthUser {
  return { id, sub: id, role, phone: null };
}

function mockConfig() {
  return { get: jest.fn().mockReturnValue('http://localhost:3005') } as never;
}

describe('6.15L.2A contextual legal acceptance', () => {
  const offerDoc = {
    id: 'offer-1',
    type: LegalDocumentType.PUBLIC_OFFER,
    version: '2026-10-03-v1',
    locale: LegalLocale.RU,
    title: 'Offer',
    content: 'Approved offer text.',
    status: LegalDocumentStatus.PUBLISHED,
    effectiveAt: null,
    publishedAt: new Date(),
    requiresReacceptance: true,
  };

  const adTermsDoc = {
    id: 'ad-1',
    type: LegalDocumentType.ADVERTISING_TERMS,
    version: '2026-10-03-v1',
    locale: LegalLocale.RU,
    title: 'Ad rules',
    content: 'Approved ad rules.',
    status: LegalDocumentStatus.PUBLISHED,
    effectiveAt: null,
    publishedAt: new Date(),
    requiresReacceptance: true,
  };

  const businessTermsDoc = {
    id: 'bt-1',
    type: LegalDocumentType.BUSINESS_TERMS,
    version: '2026-10-03-v1',
    locale: LegalLocale.RU,
    title: 'Business terms',
    content: 'Approved business terms.',
    status: LegalDocumentStatus.PUBLISHED,
    effectiveAt: null,
    publishedAt: new Date(),
    requiresReacceptance: true,
  };

  let prisma: {
    legalDocument: { findFirst: jest.Mock; findUnique: jest.Mock };
    legalAcceptance: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };
  let service: LegalService;

  beforeEach(() => {
    prisma = {
      legalDocument: {
        findFirst: jest.fn(async ({ where }: { where: { type: LegalDocumentType } }) => {
          if (where.type === LegalDocumentType.PUBLIC_OFFER) return offerDoc;
          if (where.type === LegalDocumentType.ADVERTISING_TERMS) return adTermsDoc;
          if (where.type === LegalDocumentType.BUSINESS_TERMS) return businessTermsDoc;
          return null;
        }),
        findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === offerDoc.id) return offerDoc;
          if (where.id === adTermsDoc.id) return adTermsDoc;
          if (where.id === businessTermsDoc.id) return businessTermsDoc;
          return null;
        }),
      },
      legalAcceptance: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: `acc-${data.documentId}`,
          ...data,
          acceptedAt: new Date(),
        })),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ role: UserRole.USER }) },
    };
    service = new LegalService(prisma as never, { record: jest.fn() } as never, mockConfig());
  });

  it('getLegalRequired for PLAN_PURCHASE lists pending offer', async () => {
    const res = await service.getLegalRequired('u1', LegalLocale.RU, 'PLAN_PURCHASE');
    expect(res.acceptanceRequired).toBe(true);
    expect(res.pendingAcceptance).toHaveLength(1);
    expect(res.pendingAcceptance[0]?.type).toBe(LegalDocumentType.PUBLIC_OFFER);
  });

  it('records BUSINESS_APPLICATION acceptance with correct source', async () => {
    const result = await service.recordRequiredAcceptances(authUser('u1'), {
      acceptanceSource: LegalAcceptanceSource.BUSINESS_APPLICATION,
      locale: LegalLocale.RU,
      context: 'BUSINESS_APPLICATION',
      items: [{ documentId: businessTermsDoc.id, documentVersion: businessTermsDoc.version }],
    });
    expect(result.accepted).toHaveLength(1);
    expect(prisma.legalAcceptance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          acceptanceSource: LegalAcceptanceSource.BUSINESS_APPLICATION,
        }),
      }),
    );
  });

  it('rejects wrong acceptance source for checkout context', async () => {
    await expect(
      service.recordRequiredAcceptances(authUser('u1'), {
        acceptanceSource: LegalAcceptanceSource.LOGIN,
        locale: LegalLocale.RU,
        context: 'PLAN_PURCHASE',
        items: [{ documentId: offerDoc.id, documentVersion: offerDoc.version }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('skips duplicate requirement when current acceptance exists', async () => {
    prisma.legalAcceptance.findMany = jest.fn().mockResolvedValue([
      {
        documentId: offerDoc.id,
        documentVersion: offerDoc.version,
        acceptedAt: new Date(),
      },
    ]);
    const res = await service.getLegalRequired('u1', LegalLocale.RU, 'PLAN_PURCHASE');
    expect(res.acceptanceRequired).toBe(false);
  });

  it('enforces checkout when LEGAL_ENFORCE_CHECKOUT=true', async () => {
    const prev = process.env.LEGAL_ENFORCE_CHECKOUT;
    process.env.LEGAL_ENFORCE_CHECKOUT = 'true';
    await expect(
      service.assertCheckoutLegalAcceptance('u1', LegalLocale.RU, 'PLAN_PURCHASE'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: SafetyErrorCode.LEGAL_ACCEPTANCE_REQUIRED }),
    });
    process.env.LEGAL_ENFORCE_CHECKOUT = prev;
  });

  it('allows plan purchase after offer acceptance when enforcement on', async () => {
    const prev = process.env.LEGAL_ENFORCE_CHECKOUT;
    process.env.LEGAL_ENFORCE_CHECKOUT = 'true';
    prisma.legalAcceptance.findMany = jest.fn().mockResolvedValue([
      {
        documentId: offerDoc.id,
        documentVersion: offerDoc.version,
        acceptedAt: new Date(),
      },
    ]);
    await expect(
      service.assertCheckoutLegalAcceptance('u1', LegalLocale.RU, 'PLAN_PURCHASE'),
    ).resolves.toBeUndefined();
    process.env.LEGAL_ENFORCE_CHECKOUT = prev;
  });

  it('rejects ad order when only offer accepted', async () => {
    const prev = process.env.LEGAL_ENFORCE_CHECKOUT;
    process.env.LEGAL_ENFORCE_CHECKOUT = 'true';
    prisma.legalAcceptance.findMany = jest.fn().mockResolvedValue([
      {
        documentId: offerDoc.id,
        documentVersion: offerDoc.version,
        acceptedAt: new Date(),
      },
    ]);
    await expect(
      service.assertCheckoutLegalAcceptance('u1', LegalLocale.RU, 'AD_PURCHASE'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    process.env.LEGAL_ENFORCE_CHECKOUT = prev;
  });

  it('allows ad order when both documents accepted at current version', async () => {
    const prev = process.env.LEGAL_ENFORCE_CHECKOUT;
    process.env.LEGAL_ENFORCE_CHECKOUT = 'true';
    prisma.legalAcceptance.findMany = jest.fn().mockResolvedValue([
      {
        documentId: offerDoc.id,
        documentVersion: offerDoc.version,
        acceptedAt: new Date(),
      },
      {
        documentId: adTermsDoc.id,
        documentVersion: adTermsDoc.version,
        acceptedAt: new Date(),
      },
    ]);
    await expect(
      service.assertCheckoutLegalAcceptance('u1', LegalLocale.RU, 'AD_PURCHASE'),
    ).resolves.toBeUndefined();
    process.env.LEGAL_ENFORCE_CHECKOUT = prev;
  });

  it('old version acceptance still pending on new version', async () => {
    prisma.legalAcceptance.findMany = jest.fn().mockResolvedValue([
      {
        documentId: offerDoc.id,
        documentVersion: '2025-01-01',
        acceptedAt: new Date('2025-02-01'),
      },
    ]);
    const pending = await service.listPendingForTypes('u1', LegalLocale.RU, [
      LegalDocumentType.PUBLIC_OFFER,
    ]);
    expect(pending).toHaveLength(1);
  });

  it('cannot accept DRAFT document as current requirement', async () => {
    prisma.legalDocument.findUnique = jest.fn().mockResolvedValue({
      ...offerDoc,
      status: LegalDocumentStatus.DRAFT,
    });
    await expect(
      service.recordAcceptance(authUser('u1'), {
        documentId: offerDoc.id,
        documentVersion: offerDoc.version,
        acceptanceSource: LegalAcceptanceSource.CHECKOUT,
        locale: LegalLocale.RU,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks checkout when required document not published and enforcement on', async () => {
    const prev = process.env.LEGAL_ENFORCE_CHECKOUT;
    process.env.LEGAL_ENFORCE_CHECKOUT = 'true';
    prisma.legalDocument.findFirst = jest.fn().mockResolvedValue(null);
    await expect(
      service.assertCheckoutLegalAcceptance('u1', LegalLocale.RU, 'PLAN_PURCHASE'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_PUBLISHED }),
    });
    process.env.LEGAL_ENFORCE_CHECKOUT = prev;
  });

  it('assertBusinessApplicationLegal blocks when published BT pending', async () => {
    await expect(
      service.assertBusinessApplicationLegal('u1', LegalLocale.RU),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: SafetyErrorCode.LEGAL_ACCEPTANCE_REQUIRED }),
    });
  });

  it('checkout acceptance uses CHECKOUT source', async () => {
    await service.recordRequiredAcceptances(authUser('u1'), {
      acceptanceSource: LegalAcceptanceSource.CHECKOUT,
      locale: LegalLocale.RU,
      context: 'AD_PURCHASE',
      items: [
        { documentId: offerDoc.id, documentVersion: offerDoc.version },
        { documentId: adTermsDoc.id, documentVersion: adTermsDoc.version },
      ],
    });
    expect(prisma.legalAcceptance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ acceptanceSource: LegalAcceptanceSource.CHECKOUT }),
      }),
    );
  });
});
