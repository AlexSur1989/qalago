import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditResourceType, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from './dto/subcategory.dto';

@Injectable()
export class SubcategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listPublicByCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.subcategory.findMany({
      where: { categoryId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameRu: 'asc' }],
      select: {
        id: true,
        categoryId: true,
        slug: true,
        nameRu: true,
        nameKk: true,
        icon: true,
        sortOrder: true,
      },
    });
  }

  async listAdminByCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.subcategory.findMany({
      where: { categoryId },
      orderBy: [{ sortOrder: 'asc' }, { nameRu: 'asc' }],
    });
  }

  async create(user: AuthUser, dto: CreateSubcategoryDto) {
    this.assertTaxonomyAdmin(user);
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    try {
      const row = await this.prisma.subcategory.create({
        data: {
          categoryId: dto.categoryId,
          slug: dto.slug,
          nameRu: dto.nameRu,
          nameKk: dto.nameKk,
          icon: dto.icon,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
      await this.auditLog.record({
        actor: user,
        action: AuditAction.CATEGORY_UPDATE,
        resourceType: AuditResourceType.CATEGORY,
        resourceId: dto.categoryId,
        metadata: { kind: 'subcategory_create', subcategoryId: row.id, slug: row.slug },
      });
      return row;
    } catch (e: unknown) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException('Subcategory slug already exists for this category');
      }
      throw e;
    }
  }

  async update(user: AuthUser, id: string, dto: UpdateSubcategoryDto) {
    this.assertTaxonomyAdmin(user);
    const existing = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Subcategory not found');
    }
    return this.prisma.subcategory.update({
      where: { id },
      data: dto,
    });
  }

  async deactivate(user: AuthUser, id: string) {
    return this.update(user, id, { isActive: false });
  }

  async remove(user: AuthUser, id: string) {
    this.assertTaxonomyAdmin(user);
    const refs = await this.prisma.businessSubcategory.count({ where: { subcategoryId: id } });
    if (refs > 0) {
      throw new BadRequestException(
        'Subcategory is assigned to businesses — deactivate instead of delete',
      );
    }
    await this.prisma.subcategory.delete({ where: { id } });
    return { success: true };
  }

  async assertSubcategoryFilter(subcategoryId: string, categoryId?: string) {
    const sub = await this.prisma.subcategory.findFirst({
      where: { id: subcategoryId, isActive: true },
    });
    if (!sub) {
      throw new BadRequestException('Invalid subcategory');
    }
    if (categoryId && sub.categoryId !== categoryId) {
      throw new BadRequestException('Subcategory does not belong to the selected category');
    }
    return sub;
  }

  private assertTaxonomyAdmin(user: AuthUser) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions for taxonomy management');
    }
  }

  private isUniqueViolation(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: string }).code === 'P2002'
    );
  }
}
