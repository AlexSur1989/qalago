import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Notification,
  NotificationTargetType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PushDeliveryService } from './push/push-delivery.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushDelivery: PushDeliveryService,
  ) {}

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

  async create(input: NotificationCreateInput): Promise<Notification> {
    const client = input.tx ?? this.prisma;
    const row = await client.notification.create({
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
    if (!input.tx) {
      this.pushDelivery.deliverAfterCommit(row);
    }
    return row;
  }

  /** Call after a successful transaction that created notifications with `tx`. */
  schedulePushAfterTransaction(
    notifications: Notification | Notification[] | null | undefined,
  ): void {
    if (!notifications) return;
    const list = Array.isArray(notifications) ? notifications : [notifications];
    this.pushDelivery.deliverAfterCommitMany(list);
  }

  async createForUsers(
    userIds: string[],
    input: Omit<NotificationCreateInput, 'userId' | 'tx'>,
    tx?: Prisma.TransactionClient,
  ): Promise<Notification[]> {
    const unique = [...new Set(userIds.filter(Boolean))];
    const created: Notification[] = [];
    for (const userId of unique) {
      created.push(await this.create({ ...input, userId, tx }));
    }
    return created;
  }
}
