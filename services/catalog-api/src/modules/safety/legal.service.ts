import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuditAction,
  AuditResourceType,
  LegalDocumentStatus,
  LegalDocumentType,
  LegalLocale,
  LegalAcceptanceSource,
  UserRole,
} from '@prisma/client';
import {
  DEFAULT_PERSONAL_DATA_CONSENT_MANDATORY,
  MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES,
  PUBLISHED_PLATFORM_LEGAL_VERSIONS,
  businessApplicationDocumentTypes,
  checkoutAdDocumentTypes,
  checkoutPlanDocumentTypes,
  legalPublicPathForType,
  mandatoryLegalPublicPath,
  platformAccessDocumentTypes,
  type LegalDocumentTypeSlug,
  type LegalRequirementContext,
  isStaffRole,
} from '@qalago/shared-types';
import { validateLegalDocumentContentForPublish } from './legal-publication.validation';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MANDATORY_ACCEPTANCE_LEGAL_TYPES } from './legal.constants';
import { SafetyErrorCode } from './safety-errors';

@Injectable()
export class LegalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  consumerWebOrigin(): string {
    return (
      this.config.get<string>('app.consumerWebBaseUrl') ??
      'http://localhost:3005'
    ).replace(/\/$/, '');
  }

  publicLegalUrl(type: LegalDocumentType): string | null {
    if (MANDATORY_ACCEPTANCE_LEGAL_TYPES.includes(type)) {
      const path = mandatoryLegalPublicPath(
        type as (typeof MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES)[number],
      );
      return `${this.consumerWebOrigin()}${path}`;
    }
    const path = legalPublicPathForType(type as LegalDocumentTypeSlug);
    if (!path) {
      return null;
    }
    return `${this.consumerWebOrigin()}${path}`;
  }

  personalDataConsentMandatory(): boolean {
    if (process.env.LEGAL_REQUIRE_PERSONAL_DATA_CONSENT === 'true') {
      return true;
    }
    if (process.env.LEGAL_REQUIRE_PERSONAL_DATA_CONSENT === 'false') {
      return false;
    }
    return DEFAULT_PERSONAL_DATA_CONSENT_MANDATORY;
  }

  enforceCheckoutLegal(): boolean {
    return process.env.LEGAL_ENFORCE_CHECKOUT === 'true';
  }

  platformAccessTypesForRole(role: UserRole): LegalDocumentType[] {
    const businessOwner = role === UserRole.BUSINESS;
    return platformAccessDocumentTypes({
      businessOwner,
      personalDataConsentMandatory: this.personalDataConsentMandatory(),
    }) as LegalDocumentType[];
  }

  async getPublishedDocument(type: LegalDocumentType, locale: LegalLocale) {
    const doc = await this.findPublishedDocument(type, locale);
    if (!doc) {
      throw new NotFoundException({
        message: 'Document not found',
        code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_FOUND,
      });
    }
    return this.toPublishedDto(doc);
  }

  private async findPublishedDocument(type: LegalDocumentType, locale: LegalLocale) {
    const now = new Date();
    return this.prisma.legalDocument.findFirst({
      where: {
        type,
        locale,
        status: LegalDocumentStatus.PUBLISHED,
        OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }],
      },
      orderBy: [{ effectiveAt: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  private toPublishedDto(doc: {
    id: string;
    type: LegalDocumentType;
    version: string;
    locale: LegalLocale;
    title: string;
    content: string;
    effectiveAt: Date | null;
    publishedAt: Date | null;
    requiresReacceptance: boolean;
  }) {
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
      publicUrl: this.publicLegalUrl(doc.type),
    };
  }

  async listCurrentDocumentsForTypes(locale: LegalLocale, types: LegalDocumentType[]) {
    const documents: Array<ReturnType<LegalService['toPublishedDto']>> = [];
    for (const type of types) {
      const doc = await this.findPublishedDocument(type, locale);
      if (doc) {
        documents.push(this.toPublishedDto(doc));
      }
    }
    return documents;
  }

  async listCurrentMandatoryDocuments(locale: LegalLocale) {
    return this.listCurrentDocumentsForTypes(locale, [...MANDATORY_ACCEPTANCE_LEGAL_TYPES]);
  }

  async getLegalCurrent(locale: LegalLocale, userId?: string, role?: UserRole) {
    let accessTypes = this.platformAccessTypesForRole(role ?? UserRole.USER);
    if (userId && !role) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user) {
        accessTypes = this.platformAccessTypesForRole(user.role);
      }
    }
    const required = await this.listCurrentDocumentsForTypes(locale, accessTypes);
    const base = {
      locale,
      requiredDocuments: required.map((d) => ({
        documentId: d.id,
        type: d.type,
        version: d.version,
        effectiveAt: d.effectiveAt,
        publicUrl: d.publicUrl,
        requiresReacceptance: d.requiresReacceptance,
      })),
    };

    if (!userId) {
      return {
        ...base,
        acceptanceRequired: required.length > 0,
        documents: null,
        pendingAcceptance: null,
      };
    }

    const pending = await this.listPendingForTypes(userId, locale, accessTypes);
    const pendingIds = new Set(pending.map((p) => p.documentId));
    return {
      ...base,
      acceptanceRequired: pending.length > 0,
      documents: required.map((d) => ({
        documentId: d.id,
        type: d.type,
        version: d.version,
        publicUrl: d.publicUrl,
        acceptedCurrentVersion: !pendingIds.has(d.id),
      })),
      pendingAcceptance: pending,
    };
  }

  documentTypesForContext(context: LegalRequirementContext): LegalDocumentType[] {
    switch (context) {
      case 'PLAN_PURCHASE':
        return checkoutPlanDocumentTypes() as LegalDocumentType[];
      case 'AD_PURCHASE':
        return checkoutAdDocumentTypes() as LegalDocumentType[];
      case 'BUSINESS_APPLICATION':
        return businessApplicationDocumentTypes() as LegalDocumentType[];
      default:
        throw new BadRequestException({
          message: 'Unsupported legal requirement context',
          code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_FOUND,
        });
    }
  }

  private assertAcceptanceSourceForContext(
    context: LegalRequirementContext,
    source: LegalAcceptanceSource,
  ) {
    if (context === 'BUSINESS_APPLICATION') {
      if (source !== LegalAcceptanceSource.BUSINESS_APPLICATION) {
        throw new BadRequestException({
          message: 'Invalid acceptance source for business application legal context',
          code: SafetyErrorCode.LEGAL_VERSION_STALE,
        });
      }
      return;
    }
    if (context === 'PLAN_PURCHASE' || context === 'AD_PURCHASE') {
      if (source !== LegalAcceptanceSource.CHECKOUT) {
        throw new BadRequestException({
          message: 'Invalid acceptance source for checkout legal context',
          code: SafetyErrorCode.LEGAL_VERSION_STALE,
        });
      }
    }
  }

  async getLegalRequired(
    userId: string,
    locale: LegalLocale,
    context: LegalRequirementContext,
  ) {
    const types = this.documentTypesForContext(context);
    const required = await this.listCurrentDocumentsForTypes(locale, types);
    const pending = await this.listPendingForTypes(userId, locale, types);
    const pendingIds = new Set(pending.map((p) => p.documentId));
    const enforcementActive =
      context === 'BUSINESS_APPLICATION'
        ? required.length > 0
        : this.enforceCheckoutLegal();
    return {
      context,
      locale,
      enforcementActive,
      allRequiredPublished: required.length === types.length,
      requiredDocuments: required.map((d) => ({
        documentId: d.id,
        type: d.type,
        version: d.version,
        title: d.title,
        effectiveAt: d.effectiveAt,
        publicUrl: d.publicUrl,
        requiresReacceptance: d.requiresReacceptance,
      })),
      documents: required.map((d) => ({
        documentId: d.id,
        type: d.type,
        version: d.version,
        title: d.title,
        publicUrl: d.publicUrl,
        acceptedCurrentVersion: !pendingIds.has(d.id),
      })),
      acceptanceRequired: pending.length > 0,
      pendingAcceptance: pending,
    };
  }

  /** Consumer mobile/business users; staff roles skip mandatory platform Terms gate. */
  userRequiresMandatoryLegalAcceptance(role: UserRole): boolean {
    if (isStaffRole(role)) {
      return false;
    }
    return role === UserRole.USER || role === UserRole.BUSINESS;
  }

  async hasAcceptedAllMandatory(
    userId: string,
    locale: LegalLocale,
    types: LegalDocumentType[],
  ): Promise<boolean> {
    const pending = await this.listPendingForTypes(userId, locale, types);
    return pending.length === 0;
  }

  async listPendingMandatoryAcceptance(userId: string, locale: LegalLocale) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const types = this.platformAccessTypesForRole(user?.role ?? UserRole.USER);
    return this.listPendingForTypes(userId, locale, types);
  }

  async listPendingForTypes(
    userId: string,
    locale: LegalLocale,
    types: LegalDocumentType[],
  ) {
    const required = await this.listCurrentDocumentsForTypes(locale, types);
    if (!required.length) {
      return [];
    }

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

    const pending: Array<{
      documentId: string;
      type: LegalDocumentType;
      version: string;
      publicUrl: string | null;
    }> = [];

    for (const doc of required) {
      const acc = latestByDoc.get(doc.id);
      if (!acc || acc.documentVersion !== doc.version) {
        pending.push({
          documentId: doc.id,
          type: doc.type,
          version: doc.version,
          publicUrl: doc.publicUrl,
        });
      }
    }

    return pending;
  }

  async getUserLegalStatus(userId: string, locale: LegalLocale = LegalLocale.RU) {
    const acceptances = await this.prisma.legalAcceptance.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
    });

    const pending = await this.listPendingMandatoryAcceptance(userId, locale);

    return {
      acceptances: acceptances.map((a) => ({
        documentId: a.documentId,
        documentVersion: a.documentVersion,
        acceptedAt: a.acceptedAt,
        locale: a.locale,
        acceptanceSource: a.acceptanceSource,
      })),
      pendingAcceptance: pending,
      pendingReacceptance: pending.filter((p) => {
        const acc = acceptances.find((a) => a.documentId === p.documentId);
        return Boolean(acc);
      }),
    };
  }

  async recordAcceptance(
    user: AuthUser,
    input: {
      documentId: string;
      documentVersion: string;
      acceptanceSource: LegalAcceptanceSource;
      locale: LegalLocale;
    },
  ) {
    const doc = await this.prisma.legalDocument.findUnique({
      where: { id: input.documentId },
    });
    if (!doc || doc.status !== LegalDocumentStatus.PUBLISHED) {
      throw new NotFoundException({
        message: 'Document not found',
        code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_FOUND,
      });
    }

    const current = await this.findPublishedDocument(doc.type, doc.locale);
    if (!current || current.id !== doc.id) {
      throw new BadRequestException({
        message: 'Document is not the current published version',
        code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_FOUND,
      });
    }

    if (input.documentVersion !== doc.version) {
      throw new BadRequestException({
        message: 'Legal document version is stale',
        code: SafetyErrorCode.LEGAL_VERSION_STALE,
      });
    }

    const existing = await this.prisma.legalAcceptance.findFirst({
      where: {
        userId: user.id,
        documentId: doc.id,
        documentVersion: doc.version,
      },
    });
    if (existing) {
      return existing;
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

  async recordRequiredAcceptances(
    user: AuthUser,
    input: {
      acceptanceSource: LegalAcceptanceSource;
      locale: LegalLocale;
      items: Array<{ documentId: string; documentVersion: string }>;
      context?: LegalRequirementContext;
    },
  ) {
    const types = input.context
      ? this.documentTypesForContext(input.context)
      : this.platformAccessTypesForRole(user.role);
    if (input.context) {
      this.assertAcceptanceSourceForContext(input.context, input.acceptanceSource);
    }
    const pending = await this.listPendingForTypes(user.id, input.locale, types);
    if (!pending.length) {
      return { accepted: [] as unknown[], alreadySatisfied: true };
    }

    if (input.items.length !== pending.length) {
      throw new BadRequestException({
        message: 'Acceptance payload does not match current required documents',
        code: SafetyErrorCode.LEGAL_VERSION_STALE,
      });
    }

    const pendingById = new Map(pending.map((p) => [p.documentId, p]));
    const accepted = [];
    for (const item of input.items) {
      const expected = pendingById.get(item.documentId);
      if (!expected || expected.version !== item.documentVersion) {
        throw new BadRequestException({
          message: 'Legal document version is stale',
          code: SafetyErrorCode.LEGAL_VERSION_STALE,
        });
      }
      accepted.push(
        await this.recordAcceptance(user, {
          documentId: item.documentId,
          documentVersion: item.documentVersion,
          acceptanceSource: input.acceptanceSource,
          locale: input.locale,
        }),
      );
    }
    return { accepted, alreadySatisfied: false };
  }

  async assertCheckoutLegalAcceptance(
    userId: string,
    locale: LegalLocale,
    flow: 'PLAN_PURCHASE' | 'AD_PURCHASE',
  ) {
    if (!this.enforceCheckoutLegal()) {
      return;
    }
    const types =
      flow === 'PLAN_PURCHASE'
        ? (checkoutPlanDocumentTypes() as LegalDocumentType[])
        : (checkoutAdDocumentTypes() as LegalDocumentType[]);

    for (const type of types) {
      const published = await this.findPublishedDocument(type, locale);
      if (!published) {
        throw new ForbiddenException({
          message: 'Required legal document is not published',
          code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_PUBLISHED,
          documentType: type,
        });
      }
    }

    const pending = await this.listPendingForTypes(userId, locale, types);
    if (pending.length) {
      throw new ForbiddenException({
        message: 'Legal acceptance required before checkout',
        code: SafetyErrorCode.LEGAL_ACCEPTANCE_REQUIRED,
        pendingAcceptance: pending,
      });
    }
  }

  async assertBusinessApplicationLegal(userId: string, locale: LegalLocale) {
    const types = businessApplicationDocumentTypes() as LegalDocumentType[];
    const published = await this.listCurrentDocumentsForTypes(locale, types);
    if (!published.length) {
      return;
    }
    const pending = await this.listPendingForTypes(userId, locale, types);
    if (pending.length) {
      throw new ForbiddenException({
        message: 'Business terms acceptance required',
        code: SafetyErrorCode.LEGAL_ACCEPTANCE_REQUIRED,
        pendingAcceptance: pending,
      });
    }
  }

  async publishDocument(actor: AuthUser, documentId: string) {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN may publish legal documents');
    }
    const existing = await this.prisma.legalDocument.findUnique({
      where: { id: documentId },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'Document not found',
        code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_FOUND,
      });
    }
    if (!existing.version?.trim()) {
      throw new BadRequestException({
        message: 'Legal document version is required',
        code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_FOUND,
      });
    }
    const validation = validateLegalDocumentContentForPublish(existing.content);
    if (!validation.ok) {
      throw new BadRequestException({
        message: 'Legal document cannot be published',
        code: SafetyErrorCode.LEGAL_DOCUMENT_NOT_FOUND,
        reasons: validation.reasons,
      });
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

  /** Dev/seed helper — upsert published mandatory docs from shared manifest. */
  manifestVersion(type: LegalDocumentType): string | undefined {
    if (!(MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES as readonly string[]).includes(type)) {
      return undefined;
    }
    return PUBLISHED_PLATFORM_LEGAL_VERSIONS[
      type as (typeof MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES)[number]
    ].version;
  }
}
