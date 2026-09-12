import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusinessSubcategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates subcategory IDs against business category and syncs assignments atomically.
   * When categoryId changes in the same request, validates against the new category.
   */
  async syncForBusiness(
    businessId: string,
    categoryId: string,
    subcategoryIds: string[] | undefined,
  ) {
    if (subcategoryIds === undefined) {
      return;
    }

    const uniqueIds = [...new Set(subcategoryIds)];
    if (uniqueIds.length === 0) {
      await this.prisma.businessSubcategory.deleteMany({ where: { businessId } });
      return;
    }

    const subs = await this.prisma.subcategory.findMany({
      where: { id: { in: uniqueIds } },
    });
    if (subs.length !== uniqueIds.length) {
      throw new BadRequestException('One or more subcategories are invalid');
    }

    for (const sub of subs) {
      if (sub.categoryId !== categoryId) {
        throw new BadRequestException(
          'Subcategory must belong to the business category',
        );
      }
      if (!sub.isActive) {
        throw new BadRequestException('Inactive subcategory cannot be assigned');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.businessSubcategory.deleteMany({ where: { businessId } });
      await tx.businessSubcategory.createMany({
        data: uniqueIds.map((subcategoryId) => ({ businessId, subcategoryId })),
      });
    });
  }

  async listForBusiness(businessId: string) {
    const rows = await this.prisma.businessSubcategory.findMany({
      where: { businessId },
      include: {
        subcategory: {
          select: {
            id: true,
            categoryId: true,
            slug: true,
            nameRu: true,
            nameKk: true,
            icon: true,
            sortOrder: true,
            isActive: true,
          },
        },
      },
      orderBy: { subcategory: { sortOrder: 'asc' } },
    });
    return rows.map((r) => r.subcategory);
  }

  async reconcileAfterCategoryChange(businessId: string, categoryId: string) {
    await this.prisma.businessSubcategory.deleteMany({
      where: {
        businessId,
        subcategory: { categoryId: { not: categoryId } },
      },
    });
  }
}
