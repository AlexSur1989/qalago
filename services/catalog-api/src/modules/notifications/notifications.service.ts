import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationTargetType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ListNotificationsQueryDto,
  MarkAllReadResponseDto,
  MarkReadResponseDto,
  NotificationsListResponseDto,
  resolveNotificationsPageLimit,
  UnreadCountResponseDto,
} from './dto/notification.dto';
import { toNotificationResponseDto } from './notification.mapper';

export type NotificationCreateInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  targetType?: NotificationTargetType | null;
  targetId?: string | null;
  payload?: Prisma.InputJsonValue | null;
  tx?: Prisma.TransactionClient;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationsListResponseDto> {
    const { page, limit } = resolveNotificationsPageLimit(query);
    const where = { userId };
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: rows.map(toNotificationResponseDto),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async unreadCount(userId: string): Promise<UnreadCountResponseDto> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string): Promise<MarkReadResponseDto> {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }
    return { success: true, id, isRead: true };
  }

  async markAllRead(userId: string): Promise<MarkAllReadResponseDto> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true, updated: result.count };
  }

  create(input: NotificationCreateInput) {
    const client = input.tx ?? this.prisma;
    return client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        payload: input.payload ?? undefined,
      },
    });
  }
}
