import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessStatus,
  BusinessPermission,
  Prisma,
  PromotionStatus,
  UserRole,
} from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { normalizeOptionalLocaleText } from '../../common/localized-content';
import { changedFieldsFromDto } from '../audit-log/audit-log.util';
import {
  CreatePromotionDto,
  ListPromotionsQueryDto,
  UpdatePromotionDto,
} from './dto/promotion.dto';
import {
  encodeBranchAvailabilityFromLocationIds,
  replacePromotionBranchAssignments,
} from '../../common/utils/branch-availability-management.util';
import {
  attachPromotionFeedContextLocationIds,
  mergePromotionWhereWithAnd,
  promotionCityFeedEligibilityWhere,
} from './promotion-discovery-city.util';
import {
  applyPublicPhysicalReadProjection,
  loadBusinessLocationsGroupedByBusinessId,
} from '../businesses/business-physical-read-normalization.util';
import { mapPublicPromotionItems } from '../../common/dto/public-promotion.dto.mapper';

const promotionFeedBusinessSelect = {
  id: true,
  title: true,
  slug: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  website: true,
  workHours: true,
  coverImageUrl: true,
} as const;

type FeedPromotion = Prisma.PromotionGetPayload<{
  include: {
    business: {
      select: typeof promotionFeedBusinessSelect;
    };
  };
}>;

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly planLimits: PlanLimitsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(query: ListPromotionsQueryDto, user?: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.PromotionWhereInput = {
      business: { status: BusinessStatus.ACTIVE },
    };

    let feedCityId: string | undefined;
    if (query.businessId) {
      where.business = {
        ...(where.business as Prisma.BusinessWhereInput),
        id: query.businessId,
      };
    } else {
      feedCityId = await this.cityScope.resolveCityId({
        cityId: query.cityId,
        citySlug: query.citySlug,
      });
      mergePromotionWhereWithAnd(where, promotionCityFeedEligibilityWhere(feedCityId));
    }

    const ownerView =
      query.businessId != null &&
      (await this.canManageBusiness(user, query.businessId));

    if (!ownerView) {
      where.moderationHidden = false;
    }

    if (query.activeNow) {
      where.status = PromotionStatus.ACTIVE;
      mergePromotionWhereWithAnd(where, {
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      });
    }

    if (query.activeNow && !query.businessId) {
      const rawItems = await this.prisma.promotion.findMany({
        where,
        include: {
          business: {
            select: promotionFeedBusinessSelect,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });

      const filtered = await this.applyFeedEntitlements(rawItems, now);
      const pageRows = filtered.slice(skip, skip + limit);
      let items =
        feedCityId != null
          ? await attachPromotionFeedContextLocationIds(
              this.prisma,
              feedCityId,
              pageRows,
            )
          : pageRows;
      if (feedCityId != null) {
        items = await this.normalizePromotionFeedNestedBusinessPhysical(items);
      }

      return {
        items: mapPublicPromotionItems(items),
        meta: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
        },
      };
    }

    if (ownerView || !query.businessId) {
      const publicFeedBusinessSelect =
        !ownerView && feedCityId != null
          ? promotionFeedBusinessSelect
          : {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
            };
      const [items, total] = await Promise.all([
        this.prisma.promotion.findMany({
          where,
          include: {
            business: {
              select: publicFeedBusinessSelect,
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.promotion.count({ where }),
      ]);

      let responseItems = ownerView
        ? await this.attachBranchAvailabilityToPromotions(items)
        : items;
      if (!ownerView && feedCityId != null) {
        responseItems = await attachPromotionFeedContextLocationIds(
          this.prisma,
          feedCityId,
          responseItems,
        );
        responseItems = (await this.normalizePromotionFeedNestedBusinessPhysical(
          responseItems as Array<
            (typeof responseItems)[number] & {
              business: FeedPromotion['business'];
              contextLocationId?: string;
            }
          >,
        )) as typeof responseItems;
      }
      return {
        items: ownerView
          ? responseItems
          : mapPublicPromotionItems(responseItems),
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    const allItems = await this.prisma.promotion.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ctx = await this.planLimits.getBusinessPlanContext(query.businessId);
    const publicItems = this.planLimits.applyPublicPromotionLimit(
      allItems,
      ctx.limits.maxActivePromotions,
      now,
    );
    const pageItems = publicItems.slice(skip, skip + limit);

    return {
      items: mapPublicPromotionItems(pageItems),
      meta: {
        page,
        limit,
        total: publicItems.length,
        totalPages: Math.ceil(publicItems.length / limit),
      },
    };
  }

  async create(user: AuthUser, dto: CreatePromotionDto) {
    await this.assertCanManage(user, dto.businessId);

    const status = dto.status ?? PromotionStatus.ACTIVE;
    await this.planLimits.assertCanCreatePromotion(
      dto.businessId,
      status === PromotionStatus.ACTIVE,
    );

    const ctx = await this.planLimits.getBusinessPlanContext(dto.businessId);
    const dates = this.planLimits.resolvePromotionDates(
      ctx.limits,
      dto.startDate,
      dto.endDate,
    );

    const { branchAvailability, ...promoFields } = dto;

    const promo = await this.prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({
        data: {
          businessId: promoFields.businessId,
          title: promoFields.title.trim(),
          titleKk: normalizeOptionalLocaleText(promoFields.titleKk),
          description: normalizeOptionalLocaleText(promoFields.description),
          descriptionKk: normalizeOptionalLocaleText(promoFields.descriptionKk),
          discountText: promoFields.discountText,
          startDate: dates.startDate,
          endDate: dates.endDate,
          status,
        },
      });
      if (branchAvailability) {
        await replacePromotionBranchAssignments(
          tx,
          dto.businessId,
          created.id,
          branchAvailability,
        );
      }
      return created;
    });

    await this.auditLog.recordBusinessAction(user, dto.businessId, {
      action: AuditAction.PROMOTION_CREATE,
      resourceType: AuditResourceType.PROMOTION,
      resourceId: promo.id,
      metadata: { title: dto.title },
    });

    return this.attachBranchAvailabilityOne(promo);
  }

  async update(user: AuthUser, id: string, dto: UpdatePromotionDto) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    await this.assertCanManage(user, promo.businessId);

    const ctx = await this.planLimits.getBusinessPlanContext(promo.businessId);
    const nextStatus = dto.status ?? promo.status;

    if (nextStatus === PromotionStatus.ACTIVE && promo.status !== PromotionStatus.ACTIVE) {
      await this.planLimits.assertCanActivatePromotion(promo.businessId, ctx, id);
    }

    const startInput = dto.startDate ?? promo.startDate?.toISOString();
    const endInput = dto.endDate ?? promo.endDate?.toISOString();
    const dates =
      dto.startDate !== undefined || dto.endDate !== undefined || nextStatus === PromotionStatus.ACTIVE
        ? this.planLimits.resolvePromotionDates(ctx.limits, startInput, endInput)
        : null;

    const { title, titleKk, description, descriptionKk, discountText, status, branchAvailability } =
      dto;
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.promotion.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title: title.trim() } : {}),
          ...(titleKk !== undefined ? { titleKk: normalizeOptionalLocaleText(titleKk) } : {}),
          ...(description !== undefined
            ? { description: normalizeOptionalLocaleText(description) }
            : {}),
          ...(descriptionKk !== undefined
            ? { descriptionKk: normalizeOptionalLocaleText(descriptionKk) }
            : {}),
          ...(discountText !== undefined ? { discountText } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(dates ? { startDate: dates.startDate, endDate: dates.endDate } : {}),
        },
      });
      if (branchAvailability !== undefined) {
        await replacePromotionBranchAssignments(tx, promo.businessId, id, branchAvailability);
      }
      return row;
    });

    await this.auditLog.recordBusinessAction(user, promo.businessId, {
      action: AuditAction.PROMOTION_UPDATE,
      resourceType: AuditResourceType.PROMOTION,
      resourceId: id,
      metadata: { changedFields: changedFieldsFromDto(dto as Record<string, unknown>) },
    });

    return this.attachBranchAvailabilityOne(updated);
  }

  async remove(user: AuthUser, id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    await this.assertCanManage(user, promo.businessId);
    await this.prisma.promotion.delete({ where: { id } });
    await this.auditLog.recordBusinessAction(user, promo.businessId, {
      action: AuditAction.PROMOTION_DELETE,
      resourceType: AuditResourceType.PROMOTION,
      resourceId: id,
    });
    return { success: true };
  }

  /** A.9.3.2 — nested business physical fields follow promotion contextLocationId. */
  private async normalizePromotionFeedNestedBusinessPhysical<
    T extends { business: FeedPromotion['business']; contextLocationId?: string },
  >(items: T[]): Promise<T[]> {
    if (items.length === 0) {
      return items;
    }
    const businessIds = [...new Set(items.map((item) => item.business.id))];
    const locationsByBusinessId = await loadBusinessLocationsGroupedByBusinessId(
      this.prisma,
      businessIds,
    );
    return items.map((item) => {
      const locations = locationsByBusinessId.get(item.business.id) ?? [];
      return {
        ...item,
        business: applyPublicPhysicalReadProjection(
          item.business,
          item.business,
          locations,
          item.contextLocationId,
        ),
      };
    });
  }

  /** City promotion feed: cap visible promotions per business plan entitlement. */
  private async applyFeedEntitlements(items: FeedPromotion[], now: Date) {
    const byBusiness = new Map<string, FeedPromotion[]>();
    for (const item of items) {
      const bucket = byBusiness.get(item.businessId) ?? [];
      bucket.push(item);
      byBusiness.set(item.businessId, bucket);
    }

    const filtered: FeedPromotion[] = [];
    for (const [businessId, promos] of byBusiness) {
      const ctx = await this.planLimits.getBusinessPlanContext(businessId);
      filtered.push(
        ...this.planLimits.applyPublicPromotionLimit(
          promos,
          ctx.limits.maxActivePromotions,
          now,
        ),
      );
    }

    return this.sortCityFeedPromotions(filtered);
  }

  private async canManageBusiness(user: AuthUser | undefined, businessId: string) {
    if (!user) return false;
    return this.businessAccess.hasBusinessPermission(
      user,
      businessId,
      BusinessPermission.PROMOTIONS_EDIT,
    );
  }

  /** City promotion feed: subscription tier does not affect ordering (Stage 4C). */
  private sortCityFeedPromotions(items: FeedPromotion[]) {
    return [...items].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  private async assertCanManage(user: AuthUser, businessId: string) {
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.PROMOTIONS_EDIT,
    );
  }

  private async attachBranchAvailabilityToPromotions<T extends { id: string }>(
    items: T[],
  ): Promise<(T & { branchAvailability: ReturnType<typeof encodeBranchAvailabilityFromLocationIds> })[]> {
    if (items.length === 0) return [];
    const ids = items.map((p) => p.id);
    const rows = await this.prisma.promotionBranchAvailability.findMany({
      where: { promotionId: { in: ids } },
      select: { promotionId: true, locationId: true },
      orderBy: [{ promotionId: 'asc' }, { locationId: 'asc' }],
    });
    const byPromo = new Map<string, string[]>();
    for (const row of rows) {
      const bucket = byPromo.get(row.promotionId) ?? [];
      bucket.push(row.locationId);
      byPromo.set(row.promotionId, bucket);
    }
    return items.map((item) => ({
      ...item,
      branchAvailability: encodeBranchAvailabilityFromLocationIds(byPromo.get(item.id) ?? []),
    }));
  }

  private async attachBranchAvailabilityOne(
    promo: Prisma.PromotionGetPayload<object>,
  ): Promise<
    Prisma.PromotionGetPayload<object> & {
      branchAvailability: ReturnType<typeof encodeBranchAvailabilityFromLocationIds>;
    }
  > {
    const rows = await this.prisma.promotionBranchAvailability.findMany({
      where: { promotionId: promo.id },
      select: { locationId: true },
      orderBy: { locationId: 'asc' },
    });
    return {
      ...promo,
      branchAvailability: encodeBranchAvailabilityFromLocationIds(
        rows.map((r) => r.locationId),
      ),
    };
  }
}

