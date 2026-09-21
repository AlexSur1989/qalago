import { Injectable, NotFoundException } from '@nestjs/common';
import { PushPlatform, PushProvider } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PushDeviceResponseDto,
  RegisterPushDeviceDto,
} from './dto/push-device.dto';

function normalizeLocale(locale?: string): string | null {
  if (!locale) return null;
  const lower = locale.trim().toLowerCase();
  if (lower.startsWith('kk')) return 'kk';
  if (lower.startsWith('ru')) return 'ru';
  return null;
}

@Injectable()
export class PushDevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, dto: RegisterPushDeviceDto): Promise<PushDeviceResponseDto> {
    const token = dto.token.trim();
    const locale = normalizeLocale(dto.locale);
    const now = new Date();

    const existing = await this.prisma.pushDevice.findUnique({
      where: { token },
    });

    if (existing) {
      const row = await this.prisma.pushDevice.update({
        where: { token },
        data: {
          userId,
          platform: dto.platform,
          provider: PushProvider.FCM,
          locale,
          isActive: true,
          lastSeenAt: now,
        },
      });
      return this.toResponse(row);
    }

    const row = await this.prisma.pushDevice.create({
      data: {
        userId,
        token,
        platform: dto.platform,
        provider: PushProvider.FCM,
        locale,
        isActive: true,
        lastSeenAt: now,
      },
    });
    return this.toResponse(row);
  }

  async revoke(userId: string, token: string): Promise<{ success: true }> {
    const normalized = token.trim();
    const result = await this.prisma.pushDevice.updateMany({
      where: { token: normalized, userId, isActive: true },
      data: { isActive: false },
    });
    if (result.count === 0) {
      throw new NotFoundException('Push device not found');
    }
    return { success: true };
  }

  async listActiveTokensForUser(userId: string): Promise<
    Array<{ id: string; token: string; locale: string | null; platform: PushPlatform }>
  > {
    const rows = await this.prisma.pushDevice.findMany({
      where: { userId, isActive: true },
      select: { id: true, token: true, locale: true, platform: true },
    });
    const seen = new Set<string>();
    return rows.filter((row) => {
      if (seen.has(row.token)) return false;
      seen.add(row.token);
      return true;
    });
  }

  async deactivateByTokenIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.pushDevice.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false },
    });
  }

  private toResponse(row: {
    id: string;
    platform: PushPlatform;
    isActive: boolean;
    lastSeenAt: Date;
  }): PushDeviceResponseDto {
    return {
      id: row.id,
      platform: row.platform,
      isActive: row.isActive,
      lastSeenAt: row.lastSeenAt.toISOString(),
    };
  }
}
