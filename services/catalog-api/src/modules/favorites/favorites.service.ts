import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            title: true,
            slug: true,
            address: true,
            coverImageUrl: true,
            latitude: true,
            longitude: true,
            category: { select: { title: true, icon: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
