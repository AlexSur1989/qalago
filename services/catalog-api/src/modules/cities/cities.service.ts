import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CityLaunchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';

const citySelect = {
  id: true,
  slug: true,
  nameRu: true,
  nameKk: true,
  countryCode: true,
  centerLat: true,
  centerLng: true,
  timezone: true,
  isActive: true,
  launchStatus: true,
  launchDate: true,
  createdAt: true,
} satisfies Prisma.CitySelect;

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      orderBy: { nameRu: 'asc' },
      select: citySelect,
    });
  }

  findAllAdmin() {
    return this.prisma.city.findMany({
      orderBy: [{ isActive: 'desc' }, { nameRu: 'asc' }],
      select: citySelect,
    });
  }

  async findBySlug(slug: string) {
    const city = await this.prisma.city.findFirst({
      where: { slug, isActive: true },
      select: citySelect,
    });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async create(dto: CreateCityDto) {
    const slug = dto.slug.trim().toLowerCase();

    const isActive = dto.isActive ?? true;
    const launchStatus =
      dto.launchStatus ??
      (isActive ? CityLaunchStatus.LIVE : CityLaunchStatus.COMING_SOON);

    try {
      return await this.prisma.city.create({
        data: {
          slug,
          nameRu: dto.nameRu.trim(),
          nameKk: dto.nameKk?.trim(),
          countryCode: dto.countryCode?.trim().toUpperCase() ?? 'KZ',
          centerLat: dto.centerLat,
          centerLng: dto.centerLng,
          timezone: dto.timezone?.trim() ?? 'Asia/Almaty',
          isActive,
          launchStatus,
          launchDate: isActive && launchStatus === CityLaunchStatus.LIVE ? new Date() : null,
        },
        select: citySelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`City slug already exists: ${slug}`);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCityDto) {
    await this.ensureExists(id);

    const data: Prisma.CityUpdateInput = {
      ...(dto.nameRu !== undefined ? { nameRu: dto.nameRu.trim() } : {}),
      ...(dto.nameKk !== undefined ? { nameKk: dto.nameKk.trim() || null } : {}),
      ...(dto.centerLat !== undefined ? { centerLat: dto.centerLat } : {}),
      ...(dto.centerLng !== undefined ? { centerLng: dto.centerLng } : {}),
      ...(dto.timezone !== undefined ? { timezone: dto.timezone.trim() } : {}),
      ...(dto.isActive !== undefined
        ? {
            isActive: dto.isActive,
            launchDate:
              dto.isActive && (dto.launchStatus ?? CityLaunchStatus.LIVE) === CityLaunchStatus.LIVE
                ? new Date()
                : null,
          }
        : {}),
      ...(dto.launchStatus !== undefined ? { launchStatus: dto.launchStatus } : {}),
    };

    return this.prisma.city.update({
      where: { id },
      data,
      select: citySelect,
    });
  }

  private async ensureExists(id: string) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) {
      throw new NotFoundException('City not found');
    }
  }
}
