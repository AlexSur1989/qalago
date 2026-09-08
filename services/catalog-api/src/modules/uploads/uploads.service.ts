import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResourceType, BusinessPermission } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Injectable()
export class UploadsService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly auditLog: AuditLogService,
  ) {}

  getUploadDir(): string {
    const dir = this.config.get<string>('app.uploadDir', './uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  async saveFile(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File required');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, GIF allowed');
    }
    const maxBytes = this.config.get<number>('app.maxUploadMb', 5) * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('File too large');
    }

    const ext = extname(file.originalname) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
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
