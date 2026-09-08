import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResourceType, UserRole } from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { changedFieldsFromDto } from '../audit-log/audit-log.util';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

type CategoryRecord = {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CityOrderMeta = {
  sortOrder: number;
  isHidden: boolean;
};

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(params?: { citySlug?: string }) {
    const cityId = await this.cityScope.resolveCityId({ citySlug: params?.citySlug });
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
    });
    return this.applyCityOrder(categories, cityId);
  }

  async findAllForAdmin(citySlug?: string) {
    const cityId = await this.cityScope.resolveCityId({ citySlug });
    const categories = await this.prisma.category.findMany();
    const cityOrders = await this.loadCityOrderMap(cityId);

    return categories
      .map((category) => {
        const cityMeta = cityOrders.get(category.id);
        const citySortOrder = cityMeta?.sortOrder ?? null;
        const cityIsHidden = cityMeta?.isHidden ?? false;
        const effectiveSortOrder = citySortOrder ?? category.sortOrder;
        return {
          ...category,
          citySortOrder,
          cityIsHidden,
          effectiveSortOrder,
        };
      })
      .sort(
        (a, b) =>
          a.effectiveSortOrder - b.effectiveSortOrder ||
          a.title.localeCompare(b.title, 'ru'),
      );
  }

  async bootstrapCityCategories(cityId: string, sourceCitySlug = 'uralsk') {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    if (categories.length === 0) {
      return { created: 0 };
    }

    const sourceCity = await this.prisma.city.findFirst({
      where: { slug: sourceCitySlug },
      select: { id: true },
    });

    const sourceOrders = sourceCity
      ? await this.loadCityOrderMap(sourceCity.id)
      : new Map<string, CityOrderMeta>();

    const rows = categories.map((category) => {
      const source = sourceOrders.get(category.id);
      return {
        cityId,
        categoryId: category.id,
        sortOrder: source?.sortOrder ?? category.sortOrder,
        isHidden: source?.isHidden ?? false,
      };
    });

    const result = await this.prisma.categoryCityOrder.createMany({
      data: rows,
      skipDuplicates: true,
    });

    return { created: result.count };
  }

  async upsertCityOrder(
    categoryId: string,
    citySlug: string,
    sortOrder: number,
    isHidden?: boolean,
  ) {
    await this.ensureExists(categoryId);
    const cityId = await this.cityScope.resolveCityId({ citySlug });

    await this.prisma.categoryCityOrder.upsert({
      where: {
        cityId_categoryId: { cityId, categoryId },
      },
      create: {
        cityId,
        categoryId,
        sortOrder,
        isHidden: isHidden ?? false,
      },
      update: {
        sortOrder,
        ...(isHidden !== undefined ? { isHidden } : {}),
      },
    });

    return { success: true };
  }

  async setCityVisibility(categoryId: string, citySlug: string, isHidden: boolean) {
    await this.ensureExists(categoryId);
    const cityId = await this.cityScope.resolveCityId({ citySlug });
    const category = await this.prisma.category.findUniqueOrThrow({
      where: { id: categoryId },
    });

    await this.prisma.categoryCityOrder.upsert({
      where: {
        cityId_categoryId: { cityId, categoryId },
      },
      create: {
        cityId,
        categoryId,
        sortOrder: category.sortOrder,
        isHidden,
      },
      update: { isHidden },
    });

    return { success: true, isHidden };
  }

  async create(actor: AuthUser, dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({ data: dto });
    await this.auditLog.record({
      actor,
      action: AuditAction.CATEGORY_CREATE,
      resourceType: AuditResourceType.CATEGORY,
      resourceId: category.id,
      metadata: { slug: category.slug, title: category.title },
    });
    return category;
  }

  async update(actor: AuthUser, id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    const updated = await this.prisma.category.update({ where: { id }, data: dto });
    await this.auditLog.record({
      actor,
      action: AuditAction.CATEGORY_UPDATE,
      resourceType: AuditResourceType.CATEGORY,
      resourceId: id,
      metadata: { changedFields: changedFieldsFromDto(dto as Record<string, unknown>) },
    });
    return updated;
  }

  async remove(actor: AuthUser, id: string) {
    await this.ensureExists(id);
    await this.prisma.category.delete({ where: { id } });
    await this.auditLog.record({
      actor,
      action: AuditAction.CATEGORY_DELETE,
      resourceType: AuditResourceType.CATEGORY,
      resourceId: id,
    });
    return { success: true };
  }

  private async applyCityOrder(categories: CategoryRecord[], cityId: string) {
    const cityOrders = await this.loadCityOrderMap(cityId);

    return categories
      .filter((category) => !cityOrders.get(category.id)?.isHidden)
      .map((category) => ({
        ...category,
        sortOrder: cityOrders.get(category.id)?.sortOrder ?? category.sortOrder,
      }))
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'ru'),
      );
  }

  private async loadCityOrderMap(cityId: string) {
    const rows = await this.prisma.categoryCityOrder.findMany({
      where: { cityId },
      select: { categoryId: true, sortOrder: true, isHidden: true },
    });
    return new Map(
      rows.map((row) => [
        row.categoryId,
        { sortOrder: row.sortOrder, isHidden: row.isHidden },
      ]),
    );
  }

  private async ensureExists(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
  }
}

export const CATEGORY_ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;
