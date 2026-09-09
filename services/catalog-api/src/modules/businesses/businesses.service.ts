import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessStatus, AuditAction, AuditResourceType, BusinessMembershipRole, BusinessMembershipStatus, Prisma, UserRole } from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import {
  getRequiredPermissionsForPatch,
  ownerHasAllPermissions,
  PROFILE_FIELDS,
  HOURS_FIELDS,
} from '../../common/utils/business-permission.util';
import { haversineMeters } from '../../common/utils/geo.utils';
import { compareBusinessCatalogRank } from '../../common/utils/business-rank.util';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { changedFieldsFromDto, toMembershipRole } from '../audit-log/audit-log.util';
import { CreateBusinessDto, ListBusinessesQueryDto, UpdateBusinessDto } from './dto/business.dto';
import { BusinessPublicContentService } from './business-public-content.service';
import { randomBytes } from 'crypto';

const businessListSelect = {
  id: true,
  cityId: true,
  categoryId: true,
  title: true,
  slug: true,
  shortDesc: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  whatsapp: true,
  coverImageUrl: true,
  status: true,
  isFeatured: true,
  planTier: true,
  planExpiresAt: true,
  featuredSlot: true,
  createdAt: true,
  category: { select: { id: true, title: true, slug: true, icon: true } },
} satisfies Prisma.BusinessSelect;

const businessDetailInclude = {
  category: true,
  city: { select: { id: true, slug: true, nameRu: true, timezone: true } },
};

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly businessAccess: BusinessAccessService,
    private readonly membership: BusinessMembershipService,
    private readonly planLimits: PlanLimitsService,
    private readonly publicContent: BusinessPublicContentService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Privileged platform import only (Stage 5N.5).
   * Normal users must use POST /business-applications.
   */
  async create(user: AuthUser, dto: CreateBusinessDto) {
    if (!isGlobalAdmin(user)) {
      throw new ForbiddenException(
        'Direct business creation is disabled. Submit a business application instead.',
      );
    }

    const cityId = await this.cityScope.resolveCityId({ citySlug: dto.citySlug });

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const baseSlug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;

    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          title: dto.title,
          slug,
          categoryId: dto.categoryId,
          cityId,
          address: dto.address,
          shortDesc: dto.shortDesc,
          phone: dto.phone,
          ownerId: user.id,
          status: BusinessStatus.PENDING,
        },
      });

      await this.membership.createActiveOwnerMembership(tx, user.id, business.id);

      return business;
    });
  }

  async findAll(query: ListBusinessesQueryDto) {
    const cityId = await this.cityScope.resolveCityId({
      cityId: query.cityId,
      citySlug: query.citySlug,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessWhereInput = {
      cityId,
      status: query.status ?? BusinessStatus.ACTIVE,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { shortDesc: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.findPagedItems(where, query, page, limit, skip);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async findPagedItems(
    where: Prisma.BusinessWhereInput,
    query: ListBusinessesQueryDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    const useGeo = query.latitude != null && query.longitude != null;
    const allItems = await this.prisma.business.findMany({
      where,
      select: businessListSelect,
    });

    if (!useGeo) {
      const sorted = [...allItems].sort(compareBusinessCatalogRank);
      const items = sorted.slice(skip, skip + limit);
      return [items, sorted.length] as const;
    }

    const radiusMeters = (query.radiusKm ?? 15) * 1000;
    const ranked = allItems
      .map((item) => {
        const lat = item.latitude != null ? Number(item.latitude) : null;
        const lng = item.longitude != null ? Number(item.longitude) : null;
        if (lat == null || lng == null) {
          return { item, distanceMeters: null as number | null };
        }
        const distanceMeters = haversineMeters(
          query.latitude!,
          query.longitude!,
          lat,
          lng,
        );
        return { item, distanceMeters };
      })
      .filter(({ distanceMeters }) =>
        distanceMeters == null ? true : distanceMeters <= radiusMeters,
      )
      .sort((a, b) => {
        if (a.distanceMeters == null && b.distanceMeters == null) {
          return a.item.title.localeCompare(b.item.title, 'ru');
        }
        if (a.distanceMeters == null) return 1;
        if (b.distanceMeters == null) return -1;
        if (a.distanceMeters !== b.distanceMeters) {
          return a.distanceMeters - b.distanceMeters;
        }
        return a.item.title.localeCompare(b.item.title, 'ru');
      });

    const items = ranked.slice(skip, skip + limit).map(({ item, distanceMeters }) => ({
      ...item,
      ...(distanceMeters != null
        ? { distanceMeters: Math.round(distanceMeters) }
        : {}),
    }));

    return [items, ranked.length] as const;
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findFirst({
      where: { id, status: BusinessStatus.ACTIVE },
      include: businessDetailInclude,
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const [galleryPreview, catalogPreview, promotionsPreview, reviewsPreview] =
      await Promise.all([
        this.publicContent.getGalleryPreview(id),
        this.publicContent.getCatalogPreview(id),
        this.publicContent.getPromotionsPreview(id),
        this.publicContent.getReviewsPreview(id),
      ]);

    const coverImageUrl = await this.publicContent.resolveCoverImageUrl(
      id,
      business.coverImageUrl,
      galleryPreview.items,
    );

    return {
      ...business,
      coverImageUrl,
      galleryPreview,
      catalogPreview,
      promotionsPreview,
      reviewsPreview,
    };
  }

  async findMy(user: AuthUser) {
    const businesses = await this.prisma.business.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { memberships: { some: { userId: user.id } } },
        ],
      },
      include: {
        category: true,
        city: { select: { slug: true, nameRu: true } },
        memberships: {
          where: { userId: user.id },
          select: { role: true, permissions: true, status: true },
        },
      },
      orderBy: { title: 'asc' },
    });

    const seen = new Set<string>();
    const items = [];
    for (const row of businesses) {
      if (seen.has(row.id)) continue;

      const membership = row.memberships[0];
      let accessRole: 'OWNER' | 'MANAGER' | null = null;
      let permissions: import('@prisma/client').BusinessPermission[] = [];

      if (membership) {
        if (membership.status !== BusinessMembershipStatus.ACTIVE) {
          continue;
        }
        if (membership.role === BusinessMembershipRole.OWNER) {
          accessRole = 'OWNER';
          permissions = ownerHasAllPermissions();
        } else if (membership.role === BusinessMembershipRole.MANAGER) {
          accessRole = 'MANAGER';
          permissions = membership.permissions ?? [];
        } else {
          continue;
        }
      } else if (row.ownerId === user.id) {
        accessRole = 'OWNER';
        permissions = ownerHasAllPermissions();
      } else {
        continue;
      }

      seen.add(row.id);
      const { memberships: _memberships, ...business } = row;
      items.push({
        business,
        access: {
          role: accessRole,
          permissions,
        },
      });
    }

    return { items };
  }

  async recommended(user: AuthUser, citySlug?: string) {
    const cityId = await this.cityScope.resolveCityId({ citySlug });
    const favoriteCategories = await this.prisma.favorite.findMany({
      where: { userId: user.id, business: { cityId } },
      select: { business: { select: { categoryId: true } } },
      take: 20,
    });
    const categoryIds = [
      ...new Set(favoriteCategories.map((f) => f.business.categoryId)),
    ];

    const where: Prisma.BusinessWhereInput = {
      cityId,
      status: BusinessStatus.ACTIVE,
    };
    if (categoryIds.length) {
      where.categoryId = { in: categoryIds };
    }

    return this.prisma.business
      .findMany({
        where,
        select: businessListSelect,
        take: 50,
      })
      .then((items) => [...items].sort(compareBusinessCatalogRank).slice(0, 10));
  }

  async update(id: string, user: AuthUser, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const requiredPermissions = getRequiredPermissionsForPatch(dto);
    for (const permission of requiredPermissions) {
      await this.businessAccess.assertBusinessPermission(user, id, permission);
    }

    const access = await this.businessAccess.resolveAccess(user, id);
    const changedKeys = changedFieldsFromDto(dto as Record<string, unknown>);

    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        ...dto,
        latitude: dto.latitude !== undefined ? dto.latitude : undefined,
        longitude: dto.longitude !== undefined ? dto.longitude : undefined,
      },
      include: businessDetailInclude,
    });

    const membershipRole = toMembershipRole(access.accessRole);
    const profileChanged = changedKeys.filter((k) => PROFILE_FIELDS.has(k));
    const hoursChanged = changedKeys.filter((k) => HOURS_FIELDS.has(k));

    if (profileChanged.length > 0) {
      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_PROFILE_UPDATE,
        resourceType: AuditResourceType.BUSINESS,
        resourceId: id,
        businessId: id,
        cityId: business.cityId,
        membershipRole,
        metadata: { changedFields: profileChanged },
      });
    }
    if (hoursChanged.length > 0) {
      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_HOURS_UPDATE,
        resourceType: AuditResourceType.BUSINESS,
        resourceId: id,
        businessId: id,
        cityId: business.cityId,
        membershipRole,
        metadata: { changedFields: hoursChanged },
      });
    }

    return updated;
  }
}
