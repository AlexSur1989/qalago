import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { loadPrimaryCityPresentationByBusinessId } from '../../common/utils/business-primary-city-presentation.util';
import {
  loadBusinessLocationsGroupedByBusinessId,
  normalizeFavoriteBusinessPhysical,
} from '../businesses/business-physical-read-normalization.util';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDesc: true,
            coverImageUrl: true,
            phone: true,
            whatsapp: true,
            instagram: true,
            website: true,
            workHours: true,
            category: { select: { title: true, icon: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (rows.length === 0) {
      return rows;
    }

    const businessIds = rows.map((row) => row.business.id);
    const [locationsByBusinessId, primaryCityByBusinessId] = await Promise.all([
      loadBusinessLocationsGroupedByBusinessId(this.prisma, businessIds),
      loadPrimaryCityPresentationByBusinessId(this.prisma, businessIds),
    ]);

    return rows.map((row) => {
      const physical = normalizeFavoriteBusinessPhysical(
        row.business,
        locationsByBusinessId.get(row.business.id) ?? [],
      );
      const city = primaryCityByBusinessId.get(row.business.id);
      return {
        ...row,
        business: {
          ...physical,
          cityId: city?.id ?? (physical as { cityId?: string }).cityId ?? '',
          city: city ? { slug: city.slug, nameRu: city.nameRu } : null,
        },
      };
    });
  }

  async check(userId: string, businessId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
    return { isFavorite: Boolean(favorite) };
  }

  async add(userId: string, businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
    if (existing) {
      throw new ConflictException('Already in favorites');
    }

    return this.prisma.favorite.create({
      data: { userId, businessId },
      include: { business: { select: { id: true, title: true, slug: true } } },
    });
  }

  async remove(userId: string, businessId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
    if (!existing) {
      throw new NotFoundException('Favorite not found');
    }
    await this.prisma.favorite.delete({
      where: { userId_businessId: { userId, businessId } },
    });
    return { success: true };
  }
}
