import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessStatus, AuditAction, AuditResourceType, BusinessMembershipRole, BusinessMembershipStatus, Prisma, UserRole } from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { ReviewAggregationService } from '../../common/services/review-aggregation.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import {
  getRequiredPermissionsForPatch,
  ownerHasAllPermissions,
  PROFILE_FIELDS,
  HOURS_FIELDS,
} from '../../common/utils/business-permission.util';
import type { NormalizedMapBbox } from './business-map-query.util';
import { mergeWhereWithAnd } from '../../common/utils/catalog-geo-query.util';
import {
  queryCatalogMapLocationViewportMemberRows,
  queryCatalogMapLocationViewportPage,
  queryCatalogMapViewportMemberRows,
  queryCatalogMapViewportPage,
  type CatalogMapBusinessGrainViewportRow,
  queryCatalogNearestPage,
  queryCatalogRadiusMembers,
  resolveExplicitRadiusMeters,
  resolveNearestRadiusMeters,
  type CatalogMapLocationViewportRow,
} from './business-catalog-postgis-geo.query';
import {
  assembleMapLocationBusinessListItems,
  businessLocationMapPhysicalSelect,
} from './business-map-location-list.presenter';
import {
  BusinessCatalogSort,
  compareBusinessBySort,
} from '../../common/utils/business-catalog-sort.util';
import { compareBusinessCatalogRank } from '../../common/utils/business-rank.util';
import {
  appendBusinessCatalogTextSearch,
  type BusinessCatalogSearchContext,
} from '../../common/utils/business-catalog-search.util';
import {
  compareBusinessBySearchRelevance,
  type BusinessSearchRelevanceRow,
} from '../../common/utils/business-catalog-search-relevance.util';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { changedFieldsFromDto, toMembershipRole } from '../audit-log/audit-log.util';
import { catalogUsesBlViewportPostgisPaging } from './catalog-bbox-routing.util';
import { assertCatalogGeoQuery } from '../../common/utils/catalog-geo-query.util';
import { CreateBusinessDto, ListBusinessesQueryDto, UpdateBusinessDto } from './dto/business.dto';
import {
  assertValidBusinessCoordinatePair,
  isOptionalBusinessCoordinatePairValid,
} from '../../common/utils/business-coordinates.util';
import { assertBusinessCoordinatesWithinCity } from '../../common/utils/city-geocoding-persistence.util';
import { lockBusinessAggregateForUpdate } from '../../common/utils/business-location-invariant.util';
import {
  patchTouchesBusinessToPrimaryContactSync,
  patchTouchesPrimaryPhysicalFields,
} from '../../common/utils/business-primary-location.util';
import { BusinessPublicContentService } from './business-public-content.service';
import { BusinessSubcategoryService } from './business-subcategory.service';
import { SubcategoriesService } from '../categories/subcategories.service';
import { randomBytes } from 'crypto';
import { attachEffectivePhysicalToDetail } from './business-effective-physical.util';
import {
  applyPublicPhysicalReadFromEffectivePhysical,
  loadBusinessLocationsGroupedByBusinessId,
  normalizeFavoriteBusinessPhysical,
  normalizePublicBusinessListItems,
  type PublicPhysicalReadBusinessSource,
} from './business-physical-read-normalization.util';
import { attachContextLocationIdForBranch } from './business-discovery-context.util';
import {
  businessCatalogDiscoveryCityScope,
  businessMapReadyBranchInCityScope,
} from './business-discovery-city-membership.util';
import { assertPublicCatalogBusinessStatus } from '../../common/utils/public-catalog-business-status.util';
import { resolveCityContextLocationIds } from './business-discovery-city-context.util';
import type { CatalogPostgisNearestRow } from './business-catalog-postgis-geo.query';

const businessListSelect = {
  id: true,
  cityId: true,
  categoryId: true,
  title: true,
  slug: true,
  shortDesc: true,
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

const businessListSelectForSearchRelevance = {
  ...businessListSelect,
  category: {
    select: {
      id: true,
      title: true,
      slug: true,
      icon: true,
      nameRu: true,
      nameKk: true,
    },
  },
  businessSubcategories: {
    select: { subcategory: { select: { nameRu: true, nameKk: true } } },
  },
} satisfies Prisma.BusinessSelect;

const businessDetailInclude = {
  category: true,
  city: { select: { id: true, slug: true, nameRu: true, nameKk: true, timezone: true } },
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
    private readonly businessSubcategories: BusinessSubcategoryService,
    private readonly subcategories: SubcategoriesService,
    private readonly reviewAggregation: ReviewAggregationService,
    private readonly primaryLocation: BusinessPrimaryLocationService,
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
      const { business } = await this.primaryLocation.createBusinessWithInitialPrimary(tx, {
        brand: {
          title: dto.title,
          slug,
          categoryId: dto.categoryId,
          shortDesc: dto.shortDesc,
          phone: dto.phone,
          ownerId: user.id,
          status: BusinessStatus.PENDING,
        },
        primaryPhysical: {
          cityId,
          address: dto.address,
          latitude: null,
          longitude: null,
          locationSource: null,
          workHours: null,
          phone: dto.phone ?? null,
          whatsapp: null,
          instagram: null,
          website: null,
        },
      });

      await this.membership.createActiveOwnerMembership(tx, user.id, business.id);

      return business;
    });
  }

  async findAll(query: ListBusinessesQueryDto) {
    const catalogStatus = assertPublicCatalogBusinessStatus(query.status);
    const normalizedBbox = assertCatalogGeoQuery(query);

    const cityId = await this.cityScope.resolveCityId({
      cityId: query.cityId,
      citySlug: query.citySlug,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessWhereInput = {
      ...businessCatalogDiscoveryCityScope(cityId),
      status: catalogStatus,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.subcategoryId) {
      await this.subcategories.assertSubcategoryFilter(
        query.subcategoryId,
        query.categoryId,
      );
      where.businessSubcategories = {
        some: { subcategoryId: query.subcategoryId },
      };
    }
    const searchContext = await appendBusinessCatalogTextSearch(this.prisma, where, query.search, {
      cityId,
      status: catalogStatus,
      categoryId: query.categoryId,
      subcategoryId: query.subcategoryId,
    });

    if (query.forMap === true && normalizedBbox == null) {
      mergeWhereWithAnd(where, businessMapReadyBranchInCityScope(cityId));
    }

    const [items, total] = await this.findPagedItems(
      where,
      query,
      page,
      limit,
      skip,
      searchContext,
      normalizedBbox,
      cityId,
    );

    const enrichedItems = (await this.attachCityDiscoveryContextForPage(
      items as ReadonlyArray<{ id: string }>,
      cityId,
      query,
      searchContext,
    )) as typeof items;

    const normalizedItems = await this.normalizePublicCatalogListPhysicalFields(
      enrichedItems as Array<{ id: string; cityId: string } & (typeof enrichedItems)[number]>,
      query,
    );

    return {
      items: normalizedItems,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * A.9.3.1 — top-level list physical fields = effective branch context (primary or contextLocationId).
   * Skips forMap=true rows (already BusinessLocation-grain from map presenter).
   */
  private async normalizePublicCatalogListPhysicalFields<
    T extends { id: string; cityId: string },
  >(items: readonly T[], query: ListBusinessesQueryDto): Promise<T[]> {
    if (items.length === 0 || query.forMap === true) {
      return [...items];
    }

    if (typeof this.prisma.businessLocation?.findMany !== 'function') {
      return [...items];
    }

    const businessIds = items.map((item) => item.id);
    const locationsByBusinessId = await loadBusinessLocationsGroupedByBusinessId(
      this.prisma,
      businessIds,
    );

    return normalizePublicBusinessListItems(
      items as unknown as Array<{ id: string } & PublicPhysicalReadBusinessSource>,
      locationsByBusinessId,
    ) as unknown as T[];
  }

  /**
   * Non-geo / non-map rows: deterministic branch in requested city.
   * Skips rows that already have geo/map context (A.7.9.2 nearest, forMap locationId).
   */
  private async attachCityDiscoveryContextForPage<T extends { id: string }>(
    items: readonly T[],
    cityId: string,
    query: ListBusinessesQueryDto,
    searchContext: BusinessCatalogSearchContext | null = null,
  ): Promise<T[]> {
    if (items.length === 0 || query.forMap === true) {
      return [...items];
    }

    if (typeof this.prisma.businessLocation?.findMany !== 'function') {
      return [...items];
    }

    const missingContext = items.filter(
      (item) => !('contextLocationId' in item && item.contextLocationId != null),
    );
    if (missingContext.length === 0) {
      return [...items];
    }

    const searchContextByBusinessId = searchContext?.searchContextLocationIdByBusinessId;

    const needsGenericCityContext = missingContext.filter(
      (item) => !searchContextByBusinessId?.has(item.id),
    );
    const contextByBusinessId = await resolveCityContextLocationIds(
      this.prisma,
      cityId,
      needsGenericCityContext.map((item) => item.id),
    );

    return items.map((item) => {
      if ('contextLocationId' in item && item.contextLocationId != null) {
        return item;
      }
      const searchLocationId = searchContextByBusinessId?.get(item.id);
      if (searchLocationId) {
        return attachContextLocationIdForBranch(item, searchLocationId);
      }
      const locationId = contextByBusinessId.get(item.id);
      if (!locationId) {
        return item;
      }
      return attachContextLocationIdForBranch(item, locationId);
    });
  }

  private async findPagedItems(
    where: Prisma.BusinessWhereInput,
    query: ListBusinessesQueryDto,
    page: number,
    limit: number,
    skip: number,
    searchContext: BusinessCatalogSearchContext | null,
    normalizedBbox: NormalizedMapBbox | null,
    cityId: string,
  ) {
    const hasGeo = query.latitude != null && query.longitude != null;
    const hasExplicitRadius = hasGeo && query.radiusKm != null;
    const useMapViewportPostgis = catalogUsesBlViewportPostgisPaging(query, normalizedBbox);
    const sort =
      query.sort ??
      (hasGeo ? BusinessCatalogSort.NEAREST : BusinessCatalogSort.RECOMMENDED);
    const useGeoSort = hasGeo && sort === BusinessCatalogSort.NEAREST;
    const effectiveSort =
      sort === BusinessCatalogSort.NEAREST && !hasGeo
        ? BusinessCatalogSort.RECOMMENDED
        : sort;

    if (useGeoSort) {
      return this.findPagedItemsNearestPostgis(
        query,
        skip,
        limit,
        searchContext,
        normalizedBbox,
        cityId,
      );
    }

    if (hasExplicitRadius) {
      return this.findPagedItemsWithRadiusFilter(
        where,
        query,
        skip,
        limit,
        searchContext,
        normalizedBbox,
        cityId,
        effectiveSort,
      );
    }

    if (useMapViewportPostgis) {
      return this.findPagedItemsMapViewportPostgis(
        where,
        query,
        skip,
        limit,
        searchContext,
        normalizedBbox!,
        cityId,
        effectiveSort,
      );
    }

    if (
      effectiveSort === BusinessCatalogSort.RECOMMENDED &&
      !searchContext &&
      !useGeoSort
    ) {
      return this.findPagedItemsRecommendedAtDatabase(where, skip, limit);
    }

    if (
      effectiveSort === BusinessCatalogSort.RECOMMENDED &&
      searchContext &&
      !useGeoSort
    ) {
      return this.findPagedItemsSearchRelevanceInMemory(
        where,
        searchContext,
        skip,
        limit,
      );
    }

    const allItems = await this.prisma.business.findMany({
      where,
      select: businessListSelect,
    });

    const metrics =
      sort === BusinessCatalogSort.RATING || sort === BusinessCatalogSort.POPULAR
        ? await this.loadCatalogSortMetrics(allItems.map((i) => i.id))
        : null;

    const sorted = [...allItems].sort((a, b) =>
      compareBusinessBySort(
        this.toSortRow(a, null, metrics),
        this.toSortRow(b, null, metrics),
        effectiveSort,
      ),
    );

    const items = sorted.slice(skip, skip + limit).map((item) => ({
      ...item,
      ...(metrics?.ratings.get(item.id)
        ? {
            averageRating: metrics.ratings.get(item.id)!.averageRating,
            reviewCount: metrics.ratings.get(item.id)!.reviewCount,
          }
        : {}),
    }));

    return [items, sorted.length] as const;
  }

  /** Map viewport: Business-grain bbox compat (BL) or BusinessLocation-grain when forMap=true. */
  private async findPagedItemsMapViewportPostgis(
    where: Prisma.BusinessWhereInput,
    query: ListBusinessesQueryDto,
    skip: number,
    limit: number,
    searchContext: BusinessCatalogSearchContext | null,
    mapBbox: NormalizedMapBbox,
    cityId: string,
    effectiveSort: BusinessCatalogSort,
  ) {
    if (query.forMap === true) {
      return this.findPagedItemsMapLocationViewportPostgis(
        where,
        query,
        skip,
        limit,
        searchContext,
        mapBbox,
        cityId,
        effectiveSort,
      );
    }

    const viewportParams = {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox,
      categoryId: query.categoryId,
      subcategoryId: query.subcategoryId,
      searchPattern: searchContext?.normalized ?? null,
      serviceSearchBusinessIds: searchContext
        ? [...searchContext.serviceMatchKindByBusinessId.keys()]
        : undefined,
    };

    const attachViewportBranchContext = <T extends { id: string }>(
      items: T[],
      contextByBusinessId: ReadonlyMap<string, string>,
    ) =>
      items.map((item) => {
        const locationId = contextByBusinessId.get(item.id);
        if (!locationId) return item;
        return attachContextLocationIdForBranch(item, locationId);
      });

    if (
      effectiveSort === BusinessCatalogSort.RECOMMENDED &&
      searchContext
    ) {
      const memberRows = await queryCatalogMapViewportMemberRows(
        this.prisma,
        viewportParams,
      );
      if (memberRows.length === 0) {
        return [[], 0] as const;
      }
      const contextByBusinessId = new Map(
        memberRows.map((row) => [row.businessId, row.contextLocationId]),
      );
      mergeWhereWithAnd(where, {
        id: { in: memberRows.map((row) => row.businessId) },
      });
      const [items, total] = await this.findPagedItemsSearchRelevanceInMemory(
        where,
        searchContext,
        skip,
        limit,
      );
      return [attachViewportBranchContext(items, contextByBusinessId), total] as const;
    }

    if (
      effectiveSort !== BusinessCatalogSort.RECOMMENDED &&
      effectiveSort !== BusinessCatalogSort.NEAREST
    ) {
      const memberRows = await queryCatalogMapViewportMemberRows(
        this.prisma,
        viewportParams,
      );
      if (memberRows.length === 0) {
        return [[], 0] as const;
      }
      const contextByBusinessId = new Map(
        memberRows.map((row) => [row.businessId, row.contextLocationId]),
      );
      mergeWhereWithAnd(where, {
        id: { in: memberRows.map((row) => row.businessId) },
      });
      const allItems = await this.prisma.business.findMany({
        where,
        select: businessListSelect,
      });
      const metrics =
        effectiveSort === BusinessCatalogSort.RATING ||
        effectiveSort === BusinessCatalogSort.POPULAR
          ? await this.loadCatalogSortMetrics(allItems.map((i) => i.id))
          : null;
      const sorted = [...allItems].sort((a, b) =>
        compareBusinessBySort(
          this.toSortRow(a, null, metrics),
          this.toSortRow(b, null, metrics),
          effectiveSort,
        ),
      );
      const items = attachViewportBranchContext(
        sorted.slice(skip, skip + limit).map((item) => ({
          ...item,
          ...(metrics?.ratings.get(item.id)
            ? {
                averageRating: metrics.ratings.get(item.id)!.averageRating,
                reviewCount: metrics.ratings.get(item.id)!.reviewCount,
              }
            : {}),
        })),
        contextByBusinessId,
      );
      return [items, sorted.length] as const;
    }

    const { rows, total } = await queryCatalogMapViewportPage(this.prisma, {
      ...viewportParams,
      skip,
      limit,
    });

    if (rows.length === 0) {
      return [[], total] as const;
    }

    const items = await this.hydrateBusinessGrainViewportRows(rows);
    return [items, total] as const;
  }

  private async hydrateBusinessGrainViewportRows(
    spatialRows: CatalogMapBusinessGrainViewportRow[],
  ) {
    if (spatialRows.length === 0) return [];
    const businessIds = spatialRows.map((row) => row.businessId);
    const hydrated = await this.prisma.business.findMany({
      where: { id: { in: businessIds } },
      select: businessListSelect,
    });
    const byId = new Map(hydrated.map((item) => [item.id, item]));
    return spatialRows
      .map((row) => {
        const item = byId.get(row.businessId);
        if (!item) return null;
        return attachContextLocationIdForBranch(item, row.contextLocationId);
      })
      .filter((item): item is NonNullable<typeof item> => item != null);
  }

  /** forMap viewport: one row per BusinessLocation; id remains Business.id + locationId. */
  private async findPagedItemsMapLocationViewportPostgis(
    where: Prisma.BusinessWhereInput,
    query: ListBusinessesQueryDto,
    skip: number,
    limit: number,
    searchContext: BusinessCatalogSearchContext | null,
    mapBbox: NormalizedMapBbox,
    cityId: string,
    effectiveSort: BusinessCatalogSort,
  ) {
    const viewportParams = {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox,
      categoryId: query.categoryId,
      subcategoryId: query.subcategoryId,
      searchPattern: searchContext?.normalized ?? null,
      serviceSearchBusinessIds: searchContext
        ? [...searchContext.serviceMatchKindByBusinessId.keys()]
        : undefined,
    };

    const needsBusinessExpansion =
      (effectiveSort === BusinessCatalogSort.RECOMMENDED && searchContext != null) ||
      (effectiveSort !== BusinessCatalogSort.RECOMMENDED &&
        effectiveSort !== BusinessCatalogSort.NEAREST);

    if (needsBusinessExpansion) {
      const memberRows = await queryCatalogMapLocationViewportMemberRows(
        this.prisma,
        viewportParams,
      );
      if (memberRows.length === 0) {
        return [[], 0] as const;
      }
      const memberBusinessIds = [...new Set(memberRows.map((row) => row.businessId))];
      mergeWhereWithAnd(where, { id: { in: memberBusinessIds } });

      let orderedBusinessIds: string[];
      if (effectiveSort === BusinessCatalogSort.RECOMMENDED && searchContext) {
        orderedBusinessIds = await this.orderBusinessIdsBySearchRelevance(
          where,
          searchContext,
        );
      } else {
        const allItems = await this.prisma.business.findMany({
          where,
          select: businessListSelect,
        });
        const metrics =
          effectiveSort === BusinessCatalogSort.RATING ||
          effectiveSort === BusinessCatalogSort.POPULAR
            ? await this.loadCatalogSortMetrics(allItems.map((i) => i.id))
            : null;
        orderedBusinessIds = [...allItems]
          .sort((a, b) =>
            compareBusinessBySort(
              this.toSortRow(a, null, metrics),
              this.toSortRow(b, null, metrics),
              effectiveSort,
            ),
          )
          .map((item) => item.id);
      }

      const expanded = this.expandMapLocationRowsByBusinessOrder(
        memberRows,
        orderedBusinessIds,
      );
      const pageRows = expanded.slice(skip, skip + limit);
      const items = await this.hydrateMapLocationViewportRows(pageRows);
      return [items, expanded.length] as const;
    }

    const { rows, total } = await queryCatalogMapLocationViewportPage(this.prisma, {
      ...viewportParams,
      skip,
      limit,
    });
    if (rows.length === 0) {
      return [[], total] as const;
    }
    const items = await this.hydrateMapLocationViewportRows(rows);
    return [items, total] as const;
  }

  private expandMapLocationRowsByBusinessOrder(
    memberRows: CatalogMapLocationViewportRow[],
    orderedBusinessIds: string[],
  ): CatalogMapLocationViewportRow[] {
    const byBusiness = new Map<string, CatalogMapLocationViewportRow[]>();
    for (const row of memberRows) {
      const list = byBusiness.get(row.businessId) ?? [];
      list.push(row);
      byBusiness.set(row.businessId, list);
    }
    for (const list of byBusiness.values()) {
      list.sort((a, b) => a.locationId.localeCompare(b.locationId));
    }

    const expanded: CatalogMapLocationViewportRow[] = [];
    for (const businessId of orderedBusinessIds) {
      const locations = byBusiness.get(businessId);
      if (locations) expanded.push(...locations);
    }
    return expanded;
  }

  private async orderBusinessIdsBySearchRelevance(
    where: Prisma.BusinessWhereInput,
    searchContext: BusinessCatalogSearchContext,
  ): Promise<string[]> {
    const allItems = await this.prisma.business.findMany({
      where,
      select: businessListSelectForSearchRelevance,
    });
    const toRelevanceRow = (
      item: (typeof allItems)[number],
    ): BusinessSearchRelevanceRow => ({
      id: item.id,
      title: item.title,
      shortDesc: item.shortDesc,
      category: item.category,
      businessSubcategories: item.businessSubcategories,
      serviceMatchKind:
        searchContext.serviceMatchKindByBusinessId.get(item.id) ?? null,
      branchAddressMatch: searchContext.branchAddressMatchBusinessIds.has(item.id),
    });
    return [...allItems]
      .sort((a, b) =>
        compareBusinessBySearchRelevance(
          toRelevanceRow(a),
          toRelevanceRow(b),
          searchContext.normalized,
        ),
      )
      .map((item) => item.id);
  }

  private async hydrateMapLocationViewportRows(
    spatialRows: CatalogMapLocationViewportRow[],
  ) {
    if (spatialRows.length === 0) return [];
    const businessIds = [...new Set(spatialRows.map((row) => row.businessId))];
    const locationIds = spatialRows.map((row) => row.locationId);
    const [businesses, locations] = await Promise.all([
      this.prisma.business.findMany({
        where: { id: { in: businessIds } },
        select: businessListSelect,
      }),
      this.prisma.businessLocation.findMany({
        where: { id: { in: locationIds } },
        select: businessLocationMapPhysicalSelect,
      }),
    ]);
    return assembleMapLocationBusinessListItems(spatialRows, businesses, locations);
  }

  /** Nearest / radius: PostGIS ST_DWithin + ST_Distance with SQL LIMIT/OFFSET. */
  private async findPagedItemsNearestPostgis(
    query: ListBusinessesQueryDto,
    skip: number,
    limit: number,
    searchContext: BusinessCatalogSearchContext | null,
    normalizedBbox: NormalizedMapBbox | null,
    cityId: string,
  ) {
    const serviceSearchBusinessIds = searchContext
      ? [...searchContext.serviceMatchKindByBusinessId.keys()]
      : undefined;

    const { rows, total } = await queryCatalogNearestPage(this.prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      latitude: query.latitude!,
      longitude: query.longitude!,
      radiusMeters: resolveNearestRadiusMeters(query.radiusKm),
      categoryId: query.categoryId,
      subcategoryId: query.subcategoryId,
      searchPattern: searchContext?.normalized ?? null,
      serviceSearchBusinessIds,
      mapBbox: normalizedBbox,
      skip,
      limit,
    });

    if (rows.length === 0) {
      return [[], total] as const;
    }

    const items = await this.hydrateGeoDiscoveryListItems(rows);
    return [items, total] as const;
  }

  /**
   * Explicit radiusKm is a filter independent of sort.
   * PostGIS ST_DWithin defines membership; sort/ranking runs on that set only.
   */
  private async findPagedItemsWithRadiusFilter(
    where: Prisma.BusinessWhereInput,
    query: ListBusinessesQueryDto,
    skip: number,
    limit: number,
    searchContext: BusinessCatalogSearchContext | null,
    normalizedBbox: NormalizedMapBbox | null,
    cityId: string,
    effectiveSort: BusinessCatalogSort,
  ) {
    const { rows: radiusMembers } = await queryCatalogRadiusMembers(this.prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      latitude: query.latitude!,
      longitude: query.longitude!,
      radiusMeters: resolveExplicitRadiusMeters(query.radiusKm!),
      categoryId: query.categoryId,
      subcategoryId: query.subcategoryId,
      searchPattern: searchContext?.normalized ?? null,
      serviceSearchBusinessIds: searchContext
        ? [...searchContext.serviceMatchKindByBusinessId.keys()]
        : undefined,
      mapBbox: normalizedBbox,
    });

    if (radiusMembers.length === 0) {
      return [[], 0] as const;
    }

    const geoByBusinessId = new Map(radiusMembers.map((row) => [row.id, row]));
    mergeWhereWithAnd(where, { id: { in: radiusMembers.map((row) => row.id) } });

    const attachGeoDiscovery = <T extends { id: string }>(items: T[]) =>
      this.attachGeoDiscoveryFields(items, geoByBusinessId);

    if (effectiveSort === BusinessCatalogSort.RECOMMENDED && !searchContext) {
      const [items, total] = await this.findPagedItemsRecommendedAtDatabase(
        where,
        skip,
        limit,
      );
      return [attachGeoDiscovery(items), total] as const;
    }

    if (effectiveSort === BusinessCatalogSort.RECOMMENDED && searchContext) {
      const [items, total] = await this.findPagedItemsSearchRelevanceInMemory(
        where,
        searchContext,
        skip,
        limit,
      );
      return [attachGeoDiscovery(items), total] as const;
    }

    const allItems = await this.prisma.business.findMany({
      where,
      select: businessListSelect,
    });

    const metrics =
      effectiveSort === BusinessCatalogSort.RATING ||
      effectiveSort === BusinessCatalogSort.POPULAR
        ? await this.loadCatalogSortMetrics(allItems.map((i) => i.id))
        : null;

    const sorted = [...allItems].sort((a, b) =>
      compareBusinessBySort(
        this.toSortRow(
          a,
          geoByBusinessId.get(a.id)?.distanceMeters ?? null,
          metrics,
        ),
        this.toSortRow(
          b,
          geoByBusinessId.get(b.id)?.distanceMeters ?? null,
          metrics,
        ),
        effectiveSort,
      ),
    );

    const items = attachGeoDiscovery(sorted.slice(skip, skip + limit).map((item) => ({
      ...item,
      ...(metrics?.ratings.get(item.id)
        ? {
            averageRating: metrics.ratings.get(item.id)!.averageRating,
            reviewCount: metrics.ratings.get(item.id)!.reviewCount,
          }
        : {}),
    })));

    return [items, sorted.length] as const;
  }

  private attachGeoDiscoveryFields<T extends { id: string }>(
    items: T[],
    geoByBusinessId: ReadonlyMap<string, CatalogPostgisNearestRow>,
  ) {
    return items.map((item) => {
      const geo = geoByBusinessId.get(item.id);
      if (!geo) return item;
      return attachContextLocationIdForBranch(
        { ...item, distanceMeters: geo.distanceMeters },
        geo.contextLocationId,
        { distanceMeters: geo.distanceMeters },
      );
    });
  }

  private async hydrateGeoDiscoveryListItems(rows: CatalogPostgisNearestRow[]) {
    const hydrated = await this.prisma.business.findMany({
      where: { id: { in: rows.map((row) => row.id) } },
      select: businessListSelect,
    });
    const byId = new Map(hydrated.map((item) => [item.id, item]));
    const geoById = new Map(rows.map((row) => [row.id, row]));

    return rows
      .map((row) => {
        const item = byId.get(row.id);
        if (!item) return null;
        return attachContextLocationIdForBranch(
          { ...item, distanceMeters: row.distanceMeters },
          row.contextLocationId,
          { distanceMeters: row.distanceMeters },
        );
      })
      .filter((item): item is NonNullable<typeof item> => item != null);
  }

  /** Organic discovery (no text query): ORDER BY + SKIP/TAKE in PostgreSQL. */
  private async findPagedItemsRecommendedAtDatabase(
    where: Prisma.BusinessWhereInput,
    skip: number,
    limit: number,
  ) {
    const [total, items] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        select: businessListSelect,
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
    ]);
    return [items, total] as const;
  }

  /**
   * Text search + recommended: relevance tiers applied before slice.
   * Still loads the full eligible match set (MVP-scale); count uses same WHERE.
   */
  private async findPagedItemsSearchRelevanceInMemory(
    where: Prisma.BusinessWhereInput,
    searchContext: BusinessCatalogSearchContext,
    skip: number,
    limit: number,
  ) {
    const [total, allItems] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        select: businessListSelectForSearchRelevance,
      }),
    ]);

    const toRelevanceRow = (
      item: (typeof allItems)[number],
    ): BusinessSearchRelevanceRow => ({
      id: item.id,
      title: item.title,
      shortDesc: item.shortDesc,
      category: item.category,
      businessSubcategories: item.businessSubcategories,
      serviceMatchKind:
        searchContext.serviceMatchKindByBusinessId.get(item.id) ?? null,
      branchAddressMatch: searchContext.branchAddressMatchBusinessIds.has(item.id),
    });

    const sorted = [...allItems].sort((a, b) =>
      compareBusinessBySearchRelevance(
        toRelevanceRow(a),
        toRelevanceRow(b),
        searchContext.normalized,
      ),
    );

    const pageRows = sorted.slice(skip, skip + limit);
    const items = pageRows.map((row) => {
      const { businessSubcategories: _sub, category, ...rest } = row;
      return {
        ...rest,
        category: category
          ? {
              id: category.id,
              title: category.title,
              slug: category.slug,
              icon: category.icon,
            }
          : category,
      };
    });
    return [items, total] as const;
  }

  private toSortRow(
    item: {
      id: string;
      title: string;
      planTier: import('@prisma/client').BusinessPlanTier;
      planExpiresAt: Date | null;
      isFeatured: boolean;
      featuredSlot: number | null;
    },
    distanceMeters: number | null,
    metrics: Awaited<ReturnType<BusinessesService['loadCatalogSortMetrics']>> | null,
  ) {
    const rating = metrics?.ratings.get(item.id);
    return {
      id: item.id,
      title: item.title,
      planTier: item.planTier,
      planExpiresAt: item.planExpiresAt,
      isFeatured: item.isFeatured,
      featuredSlot: item.featuredSlot,
      distanceMeters,
      averageRating: rating?.averageRating ?? null,
      reviewCount: rating?.reviewCount ?? 0,
      organicViews30d: metrics?.views.get(item.id) ?? 0,
    };
  }

  private async loadCatalogSortMetrics(businessIds: string[]) {
    const ratings = new Map<
      string,
      { averageRating: number | null; reviewCount: number }
    >();
    const views = new Map<string, number>();

    if (!businessIds.length) {
      return { ratings, views };
    }

    const aggregated = await this.reviewAggregation.aggregateForBusinessIds(businessIds);
    for (const [businessId, metrics] of aggregated) {
      ratings.set(businessId, metrics);
    }

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);
    const sinceKey = since.toISOString().slice(0, 10);
    const viewRows = await this.prisma.analyticsDailyMetric.groupBy({
      by: ['businessId'],
      where: {
        businessId: { in: businessIds },
        metricDate: { gte: sinceKey },
      },
      _sum: { views: true },
    });
    for (const row of viewRows) {
      views.set(row.businessId, row._sum.views ?? 0);
    }

    return { ratings, views };
  }

  async findOne(id: string, options?: { locationId?: string }) {
    const business = await this.prisma.business.findFirst({
      where: { id, status: BusinessStatus.ACTIVE },
      include: businessDetailInclude,
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const locations = await this.prisma.businessLocation.findMany({
      where: { businessId: id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });

    const [galleryPreview, catalogPreview, promotionsPreview, reviewsPreview, ratingMetrics] =
      await Promise.all([
        this.publicContent.getGalleryPreview(id),
        this.publicContent.getCatalogPreview(id),
        this.publicContent.getPromotionsPreview(id),
        this.publicContent.getReviewsPreview(id),
        this.reviewAggregation.aggregateForBusiness(id),
      ]);

    const coverImageUrl = await this.publicContent.resolveCoverImageUrl(
      id,
      business.coverImageUrl,
      galleryPreview.items,
    );

    const subcategories = await this.businessSubcategories.listForBusiness(id);

    const withPreviews = {
      ...business,
      coverImageUrl,
      galleryPreview,
      catalogPreview,
      promotionsPreview,
      reviewsPreview,
      averageRating: ratingMetrics.averageRating,
      reviewCount: ratingMetrics.reviewCount,
      subcategories: subcategories.filter((s) => s.isActive),
    };

    const withPhysical = attachEffectivePhysicalToDetail(
      withPreviews,
      locations,
      options?.locationId,
    );

    const withNormalizedTopLevel = applyPublicPhysicalReadFromEffectivePhysical(withPhysical);

    const [effectiveMedia, effectiveCatalog, effectivePromotions] = await Promise.all([
      this.publicContent.getEffectiveMediaForDetail(
        id,
        withNormalizedTopLevel.activeLocationId,
        business.coverImageUrl,
      ),
      this.publicContent.getEffectiveCatalogForDetail(id, withNormalizedTopLevel.activeLocationId),
      this.publicContent.getEffectivePromotionsForDetail(
        id,
        withNormalizedTopLevel.activeLocationId,
      ),
    ]);

    return {
      ...withNormalizedTopLevel,
      effectiveMedia,
      effectiveCatalog,
      effectivePromotions,
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
        city: { select: { slug: true, nameRu: true, nameKk: true } },
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

    if (items.length === 0) {
      return { items };
    }

    const businessIds = items.map((entry) => entry.business.id);
    const locationsByBusinessId = await loadBusinessLocationsGroupedByBusinessId(
      this.prisma,
      businessIds,
    );

    return {
      items: items.map((entry) => ({
        ...entry,
        business: normalizeFavoriteBusinessPhysical(
          entry.business,
          locationsByBusinessId.get(entry.business.id) ?? [],
        ),
      })),
    };
  }

  async recommended(user: AuthUser, citySlug?: string) {
    const cityId = await this.cityScope.resolveCityId({ citySlug });
    const cityScope = businessCatalogDiscoveryCityScope(cityId);
    const favoriteCategories = await this.prisma.favorite.findMany({
      where: { userId: user.id, business: cityScope },
      select: { business: { select: { categoryId: true } } },
      take: 20,
    });
    const categoryIds = [
      ...new Set(favoriteCategories.map((f) => f.business.categoryId)),
    ];

    const where: Prisma.BusinessWhereInput = {
      ...cityScope,
      status: BusinessStatus.ACTIVE,
    };
    if (categoryIds.length) {
      where.categoryId = { in: categoryIds };
    }

    const items = await this.prisma.business.findMany({
      where,
      select: businessListSelect,
      take: 50,
    });
    const ranked = [...items].sort(compareBusinessCatalogRank).slice(0, 10);
    return this.attachCityDiscoveryContextForPage(ranked, cityId, {
      limit: 10,
    } as ListBusinessesQueryDto);
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

    const { subcategoryIds, address, latitude: dtoLatitude, longitude: dtoLongitude, locationSource, ...businessLevelPatch } =
      dto;

    const touchesPrimaryPhysical = patchTouchesPrimaryPhysicalFields(changedKeys);
    const syncContactsToPrimary = patchTouchesBusinessToPrimaryContactSync(changedKeys);
    const needsAggregateLock = touchesPrimaryPhysical || syncContactsToPrimary;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (needsAggregateLock) {
        await lockBusinessAggregateForUpdate(tx, id);
      }

      let primary =
        needsAggregateLock
          ? await this.primaryLocation.getPrimaryLocationOrThrow(tx, id)
          : null;

      let resolvedLatitude: number | undefined;
      let resolvedLongitude: number | undefined;
      if (touchesPrimaryPhysical && (dtoLatitude !== undefined || dtoLongitude !== undefined)) {
        const mergedLat =
          dtoLatitude !== undefined
            ? dtoLatitude
            : primary!.latitude != null
              ? Number(primary!.latitude)
              : undefined;
        const mergedLng =
          dtoLongitude !== undefined
            ? dtoLongitude
            : primary!.longitude != null
              ? Number(primary!.longitude)
              : undefined;
        if (!isOptionalBusinessCoordinatePairValid(mergedLat, mergedLng)) {
          throw new BadRequestException(
            'latitude and longitude must be provided together and form a valid coordinate pair',
          );
        }
        if (mergedLat !== undefined && mergedLng !== undefined) {
          assertValidBusinessCoordinatePair(mergedLat, mergedLng);
          await assertBusinessCoordinatesWithinCity(
            tx as never,
            primary!.cityId,
            mergedLat,
            mergedLng,
          );
          resolvedLatitude = mergedLat;
          resolvedLongitude = mergedLng;
        }
      }

      const businessUpdateData: Prisma.BusinessUpdateInput = { ...businessLevelPatch };
      const hasBusinessLevelFields = Object.entries(businessLevelPatch).some(
        ([, value]) => value !== undefined,
      );

      let row = hasBusinessLevelFields
        ? await tx.business.update({
            where: { id },
            data: businessUpdateData,
            include: businessDetailInclude,
          })
        : await tx.business.findUniqueOrThrow({
            where: { id },
            include: businessDetailInclude,
          });

      if (syncContactsToPrimary) {
        await this.primaryLocation.syncPrimaryFromBusinessRecord(tx, row);
      }

      if (touchesPrimaryPhysical) {
        primary = await this.primaryLocation.getPrimaryLocationOrThrow(tx, id);
        const updatedPrimary = await tx.businessLocation.update({
          where: { id: primary.id },
          data: {
            address: address !== undefined ? address.trim() : undefined,
            latitude: resolvedLatitude !== undefined ? resolvedLatitude : undefined,
            longitude: resolvedLongitude !== undefined ? resolvedLongitude : undefined,
            locationSource: locationSource !== undefined ? locationSource : undefined,
          },
        });
        await this.primaryLocation.syncBusinessFromPrimaryLocationRecord(tx, updatedPrimary);
        row = await tx.business.findUniqueOrThrow({
          where: { id },
          include: businessDetailInclude,
        });
      }

      return row;
    });

    await this.businessSubcategories.syncForBusiness(
      id,
      updated.categoryId,
      subcategoryIds,
    );

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
