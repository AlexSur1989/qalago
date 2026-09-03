import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessStatus, PromotionStatus, UserRole } from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePromotionDto,
  ListPromotionsQueryDto,
  UpdatePromotionDto,
} from './dto/promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
  ) {}

  async findAll(query: ListPromotionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: {
      status?: PromotionStatus;
      business: { cityId?: string; status: BusinessStatus; id?: string };
      AND?: Array<Record<string, unknown>>;
    } = {
      business: { status: BusinessStatus.ACTIVE },
    };

    if (query.businessId) {
      where.business.id = query.businessId;
    } else {
      where.business.cityId = await this.cityScope.resolveCityId({
        cityId: query.cityId,
        citySlug: query.citySlug,
      });
    }

    if (query.activeNow) {
      where.status = PromotionStatus.ACTIVE;
      where.AND = [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              title: true,
              slug: true,
              address: true,
              coverImageUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(user: AuthUser, dto: CreatePromotionDto) {
    await this.assertCanManage(user, dto.businessId);
    return this.prisma.promotion.create({
      data: {
        businessId: dto.businessId,
        title: dto.title,
        description: dto.description,
        discountText: dto.discountText,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status ?? PromotionStatus.ACTIVE,
      },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdatePromotionDto) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    await this.assertCanManage(user, promo.businessId);

    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    await this.assertCanManage(user, promo.businessId);
    await this.prisma.promotion.delete({ where: { id } });
    return { success: true };
  }

  private async assertCanManage(user: AuthUser, businessId: string) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) return;
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId !== user.id) {
      throw new ForbiddenException('Not business owner');
    }
  }
}
