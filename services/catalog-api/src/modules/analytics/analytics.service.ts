import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsEventType, BusinessStatus, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsWindowQueryDto, CreateAnalyticsEventDto } from './dto/analytics.dto';

const EVENT_TYPES = Object.values(AnalyticsEventType);

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(dto: CreateAnalyticsEventDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: dto.businessId, status: BusinessStatus.ACTIVE },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    await this.prisma.analyticsEvent.create({
      data: {
        businessId: dto.businessId,
        type: dto.type,
      },
    });

    return { success: true };
  }

  async summary(user: AuthUser, businessId: string, query: AnalyticsWindowQueryDto) {
    await this.assertCanViewBusinessAnalytics(user, businessId);

    const days = query.days ?? 30;
    const createdAt = { gte: this.windowStart(days) };
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: { businessId, createdAt },
      _count: { _all: true },
    });

    const byType = this.emptyCounts();
    for (const item of grouped) {
      byType[item.type] = item._count._all;
    }

    return {
      businessId,
      days,
      total: Object.values(byType).reduce((sum, count) => sum + count, 0),
      byType,
    };
  }

  async trends(user: AuthUser, businessId: string, query: AnalyticsWindowQueryDto) {
    await this.assertCanViewBusinessAnalytics(user, businessId);

    const days = query.days ?? 30;
    const events = await this.prisma.analyticsEvent.findMany({
      where: { businessId, createdAt: { gte: this.windowStart(days) } },
      select: { type: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const counts = new Map<string, number>();
    for (const event of events) {
      const date = event.createdAt.toISOString().slice(0, 10);
      const key = `${date}:${event.type}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const items = [...counts.entries()].map(([key, count]) => {
      const separator = key.indexOf(':');
      return {
        date: key.slice(0, separator),
        type: key.slice(separator + 1) as AnalyticsEventType,
        count,
      };
    });

    return { businessId, days, items };
  }

  private async assertCanViewBusinessAnalytics(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) {
      return;
    }
    if (user.role === UserRole.BUSINESS && business.ownerId === user.id) {
      return;
    }

    throw new ForbiddenException('Not allowed to view analytics');
  }

  private emptyCounts(): Record<AnalyticsEventType, number> {
    return EVENT_TYPES.reduce(
      (counts, type) => ({ ...counts, [type]: 0 }),
      {} as Record<AnalyticsEventType, number>,
    );
  }

  private windowStart(days: number) {
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
