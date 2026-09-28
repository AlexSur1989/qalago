import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusinessSubcategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pre-transaction validation for staff/admin catalog writes. */
  async assertSubcategoriesForCategory(
    categoryId: string,
    subcategoryIds: string[] | undefined,
  ) {
    if (subcategoryIds === undefined) {
      return;
    }
    await this.validateSubcategoryIdsForCategory(categoryId, subcategoryIds);
  }

  private async validateSubcategoryIdsForCategory(
    categoryId: string,
    subcategoryIds: string[],
  ): Promise<string[]> {
    const uniqueIds = [...new Set(subcategoryIds)];
    if (uniqueIds.length === 0) {
      return [];
    }

    const subs = await this.prisma.subcategory.findMany({
      where: { id: { in: uniqueIds } },
    });
    if (subs.length !== uniqueIds.length) {
      throw new BadRequestException('One or more subcategories are invalid');
    }

    for (const sub of subs) {
      if (sub.categoryId !== categoryId) {
        throw new BadRequestException('Subcategory must belong to the business category');
      }
      if (!sub.isActive) {
        throw new BadRequestException('Inactive subcategory cannot be assigned');
      }
    }

    return uniqueIds;
  }

  /**
   * Validates subcategory IDs against business category and syncs assignments atomically.
   * When categoryId changes in the same request, validates against the new category.
   */
  async syncForBusinessInTx(
    tx: Prisma.TransactionClient,
    businessId: string,
    categoryId: string,
    subcategoryIds: string[] | undefined,
  ) {
    if (subcategoryIds === undefined) {
      return;
    }

    const uniqueIds = await this.validateSubcategoryIdsForCategory(categoryId, subcategoryIds);
    if (uniqueIds.length === 0) {
      await tx.businessSubcategory.deleteMany({ where: { businessId } });
      return;
    }

    await tx.businessSubcategory.deleteMany({ where: { businessId } });
    await tx.businessSubcategory.createMany({
      data: uniqueIds.map((subcategoryId) => ({ businessId, subcategoryId })),
    });
  }

  async syncForBusiness(
    businessId: string,
    categoryId: string,
    subcategoryIds: string[] | undefined,
  ) {
    if (subcategoryIds === undefined) {
      return;
    }

    await this.prisma.$transaction(async (tx) =>
      this.syncForBusinessInTx(tx, businessId, categoryId, subcategoryIds),
    );
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
