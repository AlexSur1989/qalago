import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RateLimitStoreService } from '../../common/services/rate-limit-store.service';
import { RateLimitPolicy } from '../../common/services/rate-limit-policy';
import { normalizeUserAvatar } from '../../common/utils/avatar-image.util';

@Injectable()
export class UserAvatarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly rateLimits: RateLimitStoreService,
  ) {}

  private getUploadDir(): string {
    const dir = this.config.get<string>('app.uploadDir', './uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File required');
    }

    const policy = RateLimitPolicy.UPLOAD;
    const key = `avatar:${userId}`;
    const windowMs = policy.windowSeconds * 1000;
    try {
      await this.rateLimits.assertAllowed(key, 10, windowMs);
      await this.rateLimits.recordHit(key, windowMs);
    } catch {
      throw new BadRequestException('Avatar upload quota exceeded');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const previousUrl = user.avatarUrl;
    let normalized: { data: Buffer; ext: string };
    try {
      normalized = await normalizeUserAvatar(file.buffer);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Unsupported or invalid image content');
    }

    const filename = `${randomUUID()}${normalized.ext}`;
    const filepath = join(this.getUploadDir(), filename);
    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(filepath);
      stream.write(normalized.data);
      stream.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    const avatarUrl = `/uploads/${filename}`;
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });
    } catch (e) {
      try {
        unlinkSync(filepath);
      } catch {
        /* ignore */
      }
      throw e;
    }

    if (previousUrl?.startsWith('/uploads/')) {
      this.tryDeleteUploadFile(previousUrl);
    }

    return { avatarUrl };
  }

  async deleteAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const previousUrl = user.avatarUrl;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
    if (previousUrl?.startsWith('/uploads/')) {
      this.tryDeleteUploadFile(previousUrl);
    }
    return { success: true };
  }

  private tryDeleteUploadFile(url: string) {
    const base = url.replace(/^\/uploads\//, '');
    if (base.includes('..') || base.includes('/') || base.includes('\\')) {
      return;
    }
    const filepath = join(this.getUploadDir(), base);
    try {
      unlinkSync(filepath);
    } catch {
      /* orphan cleanup deferred */
    }
  }
}
