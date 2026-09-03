import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessStatus, Prisma, UserRole } from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceMenuService } from '../service-items/service-menu.service';
import { CreateBusinessDto, ListBusinessesQueryDto, UpdateBusinessDto } from './dto/business.dto';
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
  createdAt: true,
  category: { select: { id: true, title: true, slug: true, icon: true } },
} satisfies Prisma.BusinessSelect;

const businessDetailInclude = {
  category: true,
  city: { select: { id: true, slug: true, nameRu: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  promotions: {
    where: { status: 'ACTIVE' as const },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly serviceMenuService: ServiceMenuService,
  ) {}

  async create(user: AuthUser, dto: CreateBusinessDto) {
    const cityId = await this.cityScope.resolveCityId({ citySlug: dto.citySlug });
    
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Генерируем уникальный slug
    const baseSlug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;

    return this.prisma.business.create({
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
    if (query.featured !== undefined) {
      where.isFeatured = query.featured;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { shortDesc: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        select: businessListSelect,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { title: 'asc' }],
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findFirst({
      where: { id, status: BusinessStatus.ACTIVE },
      include: businessDetailInclude,
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    const menu = await this.serviceMenuService.findPublicMenu(id);
    return { ...business, menu };
  }

  async findMy(user: AuthUser) {
    return this.prisma.business.findMany({
      where: { ownerId: user.id },
      include: { category: true, city: { select: { slug: true, nameRu: true } } },
      orderBy: { title: 'asc' },
    });
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
    } else {
      where.isFeatured = true;
    }

    return this.prisma.business.findMany({
      where,
      select: businessListSelect,
      take: 10,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async update(id: string, user: AuthUser, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    this.assertCanManage(user, business.ownerId);

    return this.prisma.business.update({
      where: { id },
      data: {
        ...dto,
        latitude: dto.latitude !== undefined ? dto.latitude : undefined,
        longitude: dto.longitude !== undefined ? dto.longitude : undefined,
      },
      include: businessDetailInclude,
    });
  }

  private assertCanManage(user: AuthUser, ownerId: string | null) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) {
      return;
    }
    if (user.role === UserRole.BUSINESS && ownerId === user.id) {
      return;
    }
    throw new ForbiddenException('Not allowed to manage this business');
  }
}
