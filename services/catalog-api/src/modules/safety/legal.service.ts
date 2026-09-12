import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  LegalDocumentStatus,
  LegalDocumentType,
  LegalLocale,
  LegalAcceptanceSource,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class LegalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getPublishedDocument(type: LegalDocumentType, locale: LegalLocale) {
    const now = new Date();
    const doc = await this.prisma.legalDocument.findFirst({
      where: {
        type,
        locale,
        status: LegalDocumentStatus.PUBLISHED,
        OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }],
      },
      orderBy: [{ effectiveAt: 'desc' }, { publishedAt: 'desc' }],
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return {
      id: doc.id,
      type: doc.type,
      version: doc.version,
      locale: doc.locale,
      title: doc.title,
      content: doc.content,
      effectiveAt: doc.effectiveAt,
      publishedAt: doc.publishedAt,
      requiresReacceptance: doc.requiresReacceptance,
    };
  }

  async getUserLegalStatus(userId: string) {
    const published = await this.prisma.legalDocument.findMany({
      where: { status: LegalDocumentStatus.PUBLISHED },
      select: {
        id: true,
        type: true,
        version: true,
        locale: true,
        requiresReacceptance: true,
      },
    });

    const acceptances = await this.prisma.legalAcceptance.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
    });

    const latestByDoc = new Map<string, (typeof acceptances)[0]>();
    for (const row of acceptances) {
      if (!latestByDoc.has(row.documentId)) {
        latestByDoc.set(row.documentId, row);
      }
    }

    const pending: Array<{ documentId: string; type: LegalDocumentType; version: string }> =
      [];
    for (const doc of published) {
      if (!doc.requiresReacceptance) continue;
      const acc = latestByDoc.get(doc.id);
      if (!acc || acc.documentVersion !== doc.version) {
        pending.push({ documentId: doc.id, type: doc.type, version: doc.version });
      }
    }

    return {
      acceptances: acceptances.map((a) => ({
        documentId: a.documentId,
        documentVersion: a.documentVersion,
        acceptedAt: a.acceptedAt,
        locale: a.locale,
      })),
      pendingReacceptance: pending,
    };
  }

  async recordAcceptance(
    user: AuthUser,
    input: {
      documentId: string;
      acceptanceSource: LegalAcceptanceSource;
      locale: LegalLocale;
    },
  ) {
    const doc = await this.prisma.legalDocument.findUnique({
      where: { id: input.documentId },
    });
    if (!doc || doc.status !== LegalDocumentStatus.PUBLISHED) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.legalAcceptance.create({
      data: {
        userId: user.id,
        documentId: doc.id,
        documentVersion: doc.version,
        acceptanceSource: input.acceptanceSource,
        locale: input.locale,
      },
    });
  }

  async publishDocument(actor: AuthUser, documentId: string) {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN may publish legal documents');
    }
    const doc = await this.prisma.legalDocument.update({
      where: { id: documentId },
      data: {
        status: LegalDocumentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    await this.auditLog.record({
      actor,
      action: AuditAction.LEGAL_DOCUMENT_PUBLISH,
      resourceType: AuditResourceType.LEGAL_DOCUMENT,
      resourceId: doc.id,
      metadata: { version: doc.version, type: doc.type },
    });
    return doc;
  }

  assertCanManageLegalDocs(user: AuthUser) {
    if (!isGlobalAdmin(user)) {
      throw new ForbiddenException('Insufficient role');
    }
    if (user.role === 'CITY_ADMIN') {
      throw new ForbiddenException('City admin cannot manage global legal documents');
    }
  }
}
