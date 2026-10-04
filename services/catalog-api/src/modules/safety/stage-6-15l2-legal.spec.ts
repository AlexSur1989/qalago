import { BadRequestException } from '@nestjs/common';
import { LegalDocumentStatus, LegalDocumentType, LegalLocale, UserRole } from '@prisma/client';
import { validateLegalDocumentContentForPublish } from './legal-publication.validation';
import { LegalService } from './legal.service';
import { AuthUser } from '../../common/types/jwt-payload.type';

describe('6.15L.2 legal publication', () => {
  it('blocks publish when operator placeholders remain', () => {
    const result = validateLegalDocumentContentForPublish(
      'Operator: [OPERATOR_LEGAL_NAME] BIN [BIN]',
    );
    expect(result.ok).toBe(false);
  });

  it('blocks publish when refund policy placeholder remains in Public Offer', () => {
    const result = validateLegalDocumentContentForPublish(
      'Returns: [REFUND_POLICY — LEGAL REVIEW REQUIRED]',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reasons.join(' ')).toContain('UNRESOLVED_PLACEHOLDERS');
    }
  });

  it('allows publish for placeholder-free stub in tests', () => {
    const result = validateLegalDocumentContentForPublish('Approved counsel text.');
    expect(result.ok).toBe(true);
  });

  it('checkout enforcement skips when LEGAL_ENFORCE_CHECKOUT is not true', async () => {
    const prev = process.env.LEGAL_ENFORCE_CHECKOUT;
    delete process.env.LEGAL_ENFORCE_CHECKOUT;
    const service = new LegalService({} as never, { record: jest.fn() } as never, {
      get: jest.fn(),
    } as never);
    await expect(
      service.assertCheckoutLegalAcceptance('u1', LegalLocale.RU, 'PLAN_PURCHASE'),
    ).resolves.toBeUndefined();
    process.env.LEGAL_ENFORCE_CHECKOUT = prev;
  });

  it('publishDocument rejects placeholder content', async () => {
    const prisma = {
      legalDocument: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'd1',
          type: LegalDocumentType.PUBLIC_OFFER,
          version: '2026-10-03-draft-1',
          content: '[REFUND_POLICY — LEGAL REVIEW REQUIRED]',
          status: LegalDocumentStatus.DRAFT,
        }),
        update: jest.fn(),
      },
    };
    const service = new LegalService(prisma as never, { record: jest.fn() } as never, {
      get: jest.fn(),
    } as never);
    const actor: AuthUser = { id: 'a1', sub: 'a1', role: UserRole.SUPER_ADMIN, phone: null };
    await expect(service.publishDocument(actor, 'd1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
