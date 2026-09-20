import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  NOTIFICATIONS_DEFAULT_LIMIT,
  NOTIFICATIONS_MAX_LIMIT,
} from '../notification.constants';
import { NotificationTargetType, NotificationType } from '@prisma/client';

export class ListNotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(NOTIFICATIONS_MAX_LIMIT)
  limit?: number;
}

export const resolveNotificationsPageLimit = (query: ListNotificationsQueryDto) => {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? NOTIFICATIONS_DEFAULT_LIMIT, NOTIFICATIONS_MAX_LIMIT);
  return { page, limit };
};

export type NotificationResponseDto = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  payload: Record<string, unknown> | null;
};

export type NotificationsListResponseDto = {
  items: NotificationResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type UnreadCountResponseDto = { count: number };

export type MarkReadResponseDto = {
  success: true;
  id: string;
  isRead: true;
};

export type MarkAllReadResponseDto = {
  success: true;
  updated: number;
};
