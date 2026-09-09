import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessApplicationStatus,
  BusinessStatus,
  CityLaunchStatus,
  NotificationType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { OnboardingRateLimitService } from '../../common/services/onboarding-rate-limit.service';
import {
  buildApplicationDedupeKey,
  businessMatchesApplicationDedupe,
} from '../../common/utils/business-application-dedupe.util';
import { normalizeKazakhstanPhone } from '../auth/auth-phone.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AdminListBusinessApplicationsQueryDto,
  CreateBusinessApplicationDto,
  RejectBusinessApplicationDto,
  UpdateBusinessApplicationDto,
} from './dto/business-application.dto';

const applicationInclude = {
  city: { select: { id: true, slug: true, nameRu: true, launchStatus: true } },
  category: { select: { id: true, title: true, slug: true } },
  approvedBusiness: { select: { id: true, title: true, slug: true, status: true } },
} satisfies Prisma.BusinessApplicationInclude;

const adminApplicationInclude = {
  ...applicationInclude,
  applicant: { select: { id: true, name: true, role: true } },
  reviewedBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.BusinessApplicationInclude;

@Injectable()
export class BusinessApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly membership: BusinessMembershipService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
    private readonly rateLimit: OnboardingRateLimitService,
  ) {}

  async createDraft(user: AuthUser, dto: CreateBusinessApplicationDto) {
    this.rateLimit.assertApplicationCreate(user.id);

    const cityId = dto.cityId || dto.citySlug
      ? await this.resolveApplicationCityId(dto)
      : await this.cityScope.resolveCityId({ citySlug: 'uralsk' });

    const dedupeKey = buildApplicationDedupeKey(
      cityId,
      dto.title ?? '',
      dto.address ?? '',
    );

    await this.assertNoDuplicateActiveApplication(user.id, dedupeKey);

    const phone = this.normalizeOptionalPhone(dto.phone);

    return this.prisma.businessApplication.create({
      data: {
        applicantUserId: user.id,
        cityId,
        categoryId: dto.categoryId ?? (await this.defaultCategoryId()),
        title: dto.title?.trim() ?? '',
        address: dto.address?.trim() ?? '',
        shortDesc: dto.shortDesc?.trim() || null,
        phone,
        dedupeKey,
        status: BusinessApplicationStatus.DRAFT,
      },
      include: applicationInclude,
    });
  }

  async listMine(user: AuthUser) {
    return this.prisma.businessApplication.findMany({
      where: { applicantUserId: user.id },
      include: applicationInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getOwn(user: AuthUser, id: string) {
    const application = await this.prisma.businessApplication.findUnique({
      where: { id },
      include: applicationInclude,
    });
    if (!application || application.applicantUserId !== user.id) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async updateOwn(user: AuthUser, id: string, dto: UpdateBusinessApplicationDto) {
    const application = await this.getOwn(user, id);
    if (
      application.status !== BusinessApplicationStatus.DRAFT &&
      application.status !== BusinessApplicationStatus.REJECTED
    ) {
      throw new BadRequestException('Application cannot be edited in current status');
    }

    const cityId = dto.cityId || dto.citySlug
      ? await this.resolveApplicationCityId(dto)
      : application.cityId;

    const title = dto.title?.trim() ?? application.title;
    const address = dto.address?.trim() ?? application.address;
    const dedupeKey = buildApplicationDedupeKey(cityId, title, address);

    if (dedupeKey !== application.dedupeKey) {
      await this.assertNoDuplicateActiveApplication(user.id, dedupeKey, id);
    }

    if (dto.categoryId) {
      await this.validateCategory(dto.categoryId);
    }

    const phone =
      dto.phone !== undefined ? this.normalizeOptionalPhone(dto.phone) : application.phone;

    return this.prisma.businessApplication.update({
      where: { id },
      data: {
        cityId,
        categoryId: dto.categoryId ?? application.categoryId,
        title,
        address,
        shortDesc: dto.shortDesc !== undefined ? dto.shortDesc.trim() || null : application.shortDesc,
        phone,
        dedupeKey,
        status: BusinessApplicationStatus.DRAFT,
        rejectionReason: null,
        reviewedByUserId: null,
        reviewedAt: null,
      },
      include: applicationInclude,
    });
  }

  async submit(user: AuthUser, id: string) {
    this.rateLimit.assertApplicationSubmit(user.id);

    const application = await this.getOwn(user, id);
    if (application.status !== BusinessApplicationStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT applications can be submitted');
    }

    await this.validateApplicationPayload(application);
    await this.assertNoDuplicateActiveApplication(user.id, application.dedupeKey, id);
    await this.assertNoExistingBusinessDuplicate(
      application.cityId,
      application.title,
      application.address,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.businessApplication.updateMany({
        where: { id, status: BusinessApplicationStatus.DRAFT },
        data: { status: BusinessApplicationStatus.PENDING },
      });
      if (result.count !== 1) {
        throw new ConflictException('Application is no longer in DRAFT status');
      }

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_APPLICATION_SUBMIT,
        resourceType: AuditResourceType.BUSINESS_APPLICATION,
        resourceId: id,
        cityId: application.cityId,
        targetUserId: user.id,
        metadata: {
          applicationId: id,
          categoryId: application.categoryId,
          oldStatus: BusinessApplicationStatus.DRAFT,
          newStatus: BusinessApplicationStatus.PENDING,
        },
        tx,
      });

      return tx.businessApplication.findUniqueOrThrow({
        where: { id },
        include: applicationInclude,
      });
    });

    return updated;
  }

  async cancel(user: AuthUser, id: string) {
    const application = await this.getOwn(user, id);
    if (
      application.status !== BusinessApplicationStatus.DRAFT &&
      application.status !== BusinessApplicationStatus.PENDING
    ) {
      throw new BadRequestException('Application cannot be cancelled in current status');
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.businessApplication.updateMany({
        where: {
          id,
          status: { in: [BusinessApplicationStatus.DRAFT, BusinessApplicationStatus.PENDING] },
        },
        data: { status: BusinessApplicationStatus.CANCELLED },
      });
      if (result.count !== 1) {
        throw new ConflictException('Application is no longer cancellable');
      }

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_APPLICATION_CANCEL,
        resourceType: AuditResourceType.BUSINESS_APPLICATION,
        resourceId: id,
        cityId: application.cityId,
        targetUserId: user.id,
        metadata: {
          applicationId: id,
          oldStatus: application.status,
          newStatus: BusinessApplicationStatus.CANCELLED,
        },
        tx,
      });

      return tx.businessApplication.findUniqueOrThrow({
        where: { id },
        include: applicationInclude,
      });
    });
  }

  async adminList(user: AuthUser, query: AdminListBusinessApplicationsQueryDto) {
    this.assertModerator(user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessApplicationWhereInput = {};
    if (query.status) where.status = query.status;

    const scopedCityId = await this.resolveAdminCityFilter(user, query);
    if (scopedCityId) where.cityId = scopedCityId;

    const [items, total] = await Promise.all([
      this.prisma.businessApplication.findMany({
        where,
        include: adminApplicationInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.businessApplication.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async adminGet(user: AuthUser, id: string) {
    this.assertModerator(user);
    const application = await this.prisma.businessApplication.findUnique({
      where: { id },
      include: adminApplicationInclude,
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    await this.assertModeratorCityScope(user, application.cityId);
    return application;
  }

  async adminReject(user: AuthUser, id: string, dto: RejectBusinessApplicationDto) {
    this.assertModerator(user);
    const application = await this.adminGet(user, id);
    if (application.status !== BusinessApplicationStatus.PENDING) {
      throw new BadRequestException('Only PENDING applications can be rejected');
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.businessApplication.updateMany({
        where: { id, status: BusinessApplicationStatus.PENDING },
        data: {
          status: BusinessApplicationStatus.REJECTED,
          rejectionReason: dto.rejectionReason.trim(),
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
        },
      });
      if (result.count !== 1) {
        throw new ConflictException('Application is no longer pending');
      }

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_APPLICATION_REJECT,
        resourceType: AuditResourceType.BUSINESS_APPLICATION,
        resourceId: id,
        cityId: application.cityId,
        targetUserId: application.applicantUserId,
        metadata: {
          applicationId: id,
          categoryId: application.categoryId,
          oldStatus: BusinessApplicationStatus.PENDING,
          newStatus: BusinessApplicationStatus.REJECTED,
        },
        tx,
      });

      const updated = await tx.businessApplication.findUniqueOrThrow({
        where: { id },
        include: adminApplicationInclude,
      });

      await this.notifications.create({
        userId: application.applicantUserId,
        type: NotificationType.GENERAL,
        title: 'Заявка на бизнес отклонена',
        body: dto.rejectionReason.trim(),
      });

      return updated;
    });
  }

  async adminApprove(user: AuthUser, id: string) {
    this.assertModerator(user);
    const application = await this.adminGet(user, id);

    if (application.status === BusinessApplicationStatus.APPROVED) {
      return {
        application,
        business: application.approvedBusiness,
      };
    }

    if (application.status !== BusinessApplicationStatus.PENDING) {
      throw new BadRequestException('Only PENDING applications can be approved');
    }

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.businessApplication.findUnique({ where: { id } });
      if (!locked || locked.status !== BusinessApplicationStatus.PENDING) {
        throw new ConflictException('Application is no longer pending');
      }

      await this.validateApplicationPayload(locked, tx);
      await this.assertNoExistingBusinessDuplicate(
        locked.cityId,
        locked.title,
        locked.address,
        tx,
      );

      const city = await tx.city.findUniqueOrThrow({ where: { id: locked.cityId } });
      const businessStatus =
        city.launchStatus === CityLaunchStatus.LIVE
          ? BusinessStatus.ACTIVE
          : BusinessStatus.PENDING;

      const slug = await this.generateUniqueSlug(tx, locked.title);
      const business = await tx.business.create({
        data: {
          title: locked.title.trim(),
          slug,
          categoryId: locked.categoryId,
          cityId: locked.cityId,
          address: locked.address.trim(),
          shortDesc: locked.shortDesc,
          phone: locked.phone,
          ownerId: locked.applicantUserId,
          status: businessStatus,
        },
      });

      await this.membership.createActiveOwnerMembership(
        tx,
        locked.applicantUserId,
        business.id,
      );

      const approveResult = await tx.businessApplication.updateMany({
        where: { id, status: BusinessApplicationStatus.PENDING },
        data: {
          status: BusinessApplicationStatus.APPROVED,
          approvedBusinessId: business.id,
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });
      if (approveResult.count !== 1) {
        throw new ConflictException('Application approval race detected');
      }

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_APPLICATION_APPROVE,
        resourceType: AuditResourceType.BUSINESS_APPLICATION,
        resourceId: id,
        businessId: business.id,
        cityId: locked.cityId,
        targetUserId: locked.applicantUserId,
        metadata: {
          applicationId: id,
          categoryId: locked.categoryId,
          oldStatus: BusinessApplicationStatus.PENDING,
          newStatus: BusinessApplicationStatus.APPROVED,
        },
        tx,
      });

      const updatedApplication = await tx.businessApplication.findUniqueOrThrow({
        where: { id },
        include: adminApplicationInclude,
      });

      await this.notifications.create({
        userId: locked.applicantUserId,
        type: NotificationType.GENERAL,
        title: 'Заявка на бизнес одобрена',
        body: `«${business.title}» создан${businessStatus === BusinessStatus.ACTIVE ? ' и опубликован' : ' и ожидает запуска города'}.`,
      });

      return { application: updatedApplication, business };
    });
  }

  private assertModerator(user: AuthUser) {
    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.CITY_ADMIN
    ) {
      throw new ForbiddenException('Moderator access required');
    }
  }

  private async assertModeratorCityScope(user: AuthUser, cityId: string) {
    await this.cityScope.assertBusinessInAdminScope(user, cityId);
  }

  private async resolveAdminCityFilter(
    user: AuthUser,
    query: AdminListBusinessApplicationsQueryDto,
  ): Promise<string | undefined> {
    if (user.role === UserRole.CITY_ADMIN) {
      const managed = await this.cityScope.resolveAdminCityId(user);
      if (query.cityId && query.cityId !== managed) {
        throw new ForbiddenException('Not allowed to filter applications in this city');
      }
      if (query.citySlug) {
        const requested = await this.cityScope.resolveCityId({ citySlug: query.citySlug });
        if (requested !== managed) {
          throw new ForbiddenException('Not allowed to filter applications in this city');
        }
      }
      return managed;
    }

    if (query.cityId) return query.cityId;
    if (query.citySlug) return this.cityScope.resolveCityId({ citySlug: query.citySlug });
    return undefined;
  }

  private async resolveApplicationCityId(
    dto: Pick<CreateBusinessApplicationDto, 'cityId' | 'citySlug'>,
  ) {
    return this.cityScope.resolveCityId({
      cityId: dto.cityId,
      citySlug: dto.citySlug,
    });
  }

  private async defaultCategoryId() {
    const category = await this.prisma.category.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (!category) {
      throw new BadRequestException('No active categories available');
    }
    return category.id;
  }

  private async validateCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || !category.isActive) {
      throw new BadRequestException('Category not found or inactive');
    }
  }

  private async validateApplicationPayload(
    application: {
      title: string;
      categoryId: string;
      cityId: string;
      address: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    if (!application.title.trim() || application.title.trim().length < 2) {
      throw new BadRequestException('Title is required');
    }
    if (!application.address.trim() || application.address.trim().length < 2) {
      throw new BadRequestException('Address is required');
    }

    const city = await client.city.findUnique({ where: { id: application.cityId } });
    if (!city || !city.isActive) {
      throw new BadRequestException('City not found');
    }

    await this.validateCategory(application.categoryId);
  }

  private normalizeOptionalPhone(phone?: string | null) {
    if (!phone?.trim()) return null;
    const normalized = normalizeKazakhstanPhone(phone);
    if (!normalized) {
      throw new BadRequestException('Invalid phone number');
    }
    return normalized;
  }

  private async assertNoDuplicateActiveApplication(
    applicantUserId: string,
    dedupeKey: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.businessApplication.findFirst({
      where: {
        applicantUserId,
        dedupeKey,
        status: { in: [BusinessApplicationStatus.DRAFT, BusinessApplicationStatus.PENDING] },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(
        'You already have an active application for this business identity',
      );
    }
  }

  private async assertNoExistingBusinessDuplicate(
    cityId: string,
    title: string,
    address: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const candidates = await client.business.findMany({
      where: { cityId },
      select: { id: true, cityId: true, title: true, address: true },
    });
    const duplicate = candidates.find((b) =>
      businessMatchesApplicationDedupe(b, cityId, title, address),
    );
    if (duplicate) {
      throw new ConflictException('A business with the same name and address already exists');
    }
  }

  private async generateUniqueSlug(tx: Prisma.TransactionClient, title: string) {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;
      const exists = await tx.business.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) return slug;
    }

    throw new ConflictException('Could not generate unique business slug');
  }
}
