import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import {
  assertReasonableImageDimensions,
  detectImageFormat,
  extensionForFormat,
} from '../../common/utils/image-magic-bytes.util';
import { AuditAction, AuditResourceType, BusinessPermission } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RateLimitStoreService } from '../../common/services/rate-limit-store.service';
import { RateLimitPolicy } from '../../common/services/rate-limit-policy';

@Injectable()
export class UploadsService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly auditLog: AuditLogService,
    private readonly rateLimits: RateLimitStoreService,
  ) {}

  getUploadDir(): string {
    const dir = this.config.get<string>('app.uploadDir', './uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  async saveFileForUser(
    user: AuthUser,
    file: Express.Multer.File,
    businessId?: string,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File required');
    await this.assertUploadAuthorized(user, businessId);

    const maxBytes = this.config.get<number>('app.maxUploadMb', 5) * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('File too large');
    }

    const buffer = file.buffer;
    const format = detectImageFormat(buffer);
    if (!format) {
      throw new BadRequestException('Unsupported or invalid image content');
    }
    try {
      assertReasonableImageDimensions(buffer, format);
    } catch {
      throw new BadRequestException('Image dimensions too large');
    }

    const filename = `${randomUUID()}${extensionForFormat(format)}`;
    const dir = this.getUploadDir();
    const filepath = join(dir, filename);

    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(filepath);
      stream.write(file.buffer);
      stream.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return { url: `/uploads/${filename}` };
  }

  private async assertUploadAuthorized(user: AuthUser, businessId?: string): Promise<void> {
    const isPlatformStaff =
      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'CITY_ADMIN';
    if (isPlatformStaff) {
      return;
    }
    if (!businessId) {
      throw new BadRequestException('businessId is required for business uploads');
    }
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.PHOTOS_EDIT,
    );

    const policy = RateLimitPolicy.UPLOAD;
    const key = `upload:${businessId}:${user.id}`;
    const windowMs = policy.windowSeconds * 1000;
    try {
      await this.rateLimits.assertAllowed(key, policy.limit, windowMs);
      await this.rateLimits.recordHit(key, windowMs);
    } catch {
      throw new BadRequestException('Upload quota exceeded for this business');
    }
  }

  async attachToBusiness(user: AuthUser, businessId: string, imageUrl: string, asCover = false) {
    await this.assertCanManage(user, businessId);
    await this.planLimits.assertCanAddPhoto(businessId);

    const image = await this.prisma.businessImage.create({
      data: { businessId, imageUrl },
    });

    if (asCover) {
      await this.prisma.business.update({
        where: { id: businessId },
        data: { coverImageUrl: imageUrl },
      });
      await this.auditLog.recordBusinessAction(user, businessId, {
        action: AuditAction.BUSINESS_COVER_CHANGE,
        resourceType: AuditResourceType.BUSINESS_IMAGE,
        resourceId: image.id,
        metadata: { imageId: image.id },
      });
    } else {
      await this.auditLog.recordBusinessAction(user, businessId, {
        action: AuditAction.BUSINESS_PHOTO_ADD,
        resourceType: AuditResourceType.BUSINESS_IMAGE,
        resourceId: image.id,
        metadata: { imageId: image.id },
      });
    }

    return image;
  }

  async listBusinessImages(user: AuthUser, businessId: string) {
    await this.assertCanManage(user, businessId);
    return this.prisma.businessImage.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async deleteBusinessImage(user: AuthUser, businessId: string, imageId: string) {
    await this.assertCanManage(user, businessId);
    const image = await this.prisma.businessImage.findFirst({
      where: { id: imageId, businessId },
    });
    if (!image) throw new NotFoundException('Image not found');

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { coverImageUrl: true },
    });

    await this.prisma.businessImage.delete({ where: { id: imageId } });

    await this.auditLog.recordBusinessAction(user, businessId, {
      action: AuditAction.BUSINESS_PHOTO_DELETE,
      resourceType: AuditResourceType.BUSINESS_IMAGE,
      resourceId: imageId,
      metadata: { imageId },
    });

    if (business?.coverImageUrl === image.imageUrl) {
      const next = await this.prisma.businessImage.findFirst({
        where: { businessId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      await this.prisma.business.update({
        where: { id: businessId },
        data: { coverImageUrl: next?.imageUrl ?? null },
      });
    }

    return { success: true };
  }

  async setBusinessCover(user: AuthUser, businessId: string, imageId: string) {
    await this.assertCanManage(user, businessId);
    const image = await this.prisma.businessImage.findFirst({
      where: { id: imageId, businessId },
    });
    if (!image) throw new NotFoundException('Image not found');

    await this.prisma.business.update({
      where: { id: businessId },
      data: { coverImageUrl: image.imageUrl },
    });

    await this.auditLog.recordBusinessAction(user, businessId, {
      action: AuditAction.BUSINESS_COVER_CHANGE,
      resourceType: AuditResourceType.BUSINESS_IMAGE,
      resourceId: imageId,
      metadata: { imageId },
    });

    return { success: true, coverImageUrl: image.imageUrl };
  }

  private async assertCanManage(user: AuthUser, businessId: string) {
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.PHOTOS_EDIT,
    );
  }
}
