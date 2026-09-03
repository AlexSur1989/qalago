import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      orderBy: { nameRu: 'asc' },
      select: {
        id: true,
        slug: true,
        nameRu: true,
        nameKk: true,
        countryCode: true,
        centerLat: true,
        centerLng: true,
        timezone: true,
        isActive: true,
        launchDate: true,
      },
    });
  }

  async findBySlug(slug: string) {
    const city = await this.prisma.city.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        slug: true,
        nameRu: true,
        nameKk: true,
        countryCode: true,
        centerLat: true,
        centerLng: true,
        timezone: true,
        isActive: true,
        launchDate: true,
      },
    });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }
}
