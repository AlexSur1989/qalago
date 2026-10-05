import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResourceType, BusinessPermission } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RateLimitStoreService } from '../../common/services/rate-limit-store.service';
import { RateLimitPolicy } from '../../common/services/rate-limit-policy';
import {
  assertBrandCoverOnly,
  assertImageEligibleForBrandCover,
  buildBusinessImagesListWhere,
  ListBusinessImagesFilter,
  resolveAttachLocationId,
} from './business-image-scope.util';
import {
  ImageUploadPolicy,
  ImageUploadPolicyPreset,
  processUploadedImage,
} from '../../common/media-upload/process-uploaded-image.util';
import {
  MediaUploadErrorCode,
  mediaUploadBadRequest,
} from '../../common/media-upload/media-upload.errors';
import { assertAttachableLocalUploadPath } from '../../common/media-upload/trusted-media-url.util';
import { localUploadFileExists } from '../../common/media-upload/local-upload-storage.util';
import {
  countMediaUrlReferences,
  tryDeleteLocalUploadIfUnreferenced,
} from '../../common/media-upload/media-url-reference.util';
import { PLATFORM_CATALOG_UPLOAD_CONTEXT } from '../../common/media-upload/upload-context.constants';
import { UploadReceiptService, UploadReceiptScope } from '../../common/media-upload/upload-receipt.service';
import { assertBusinessAttachOwnership } from '../../common/media-upload/media-attach-ownership.util';

@Injectable()
export class UploadsService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly auditLog: AuditLogService,
    private readonly rateLimits: RateLimitStoreService,
    private readonly uploadReceipts: UploadReceiptService,
  ) {}

  getUploadDir(): string {
    const dir = this.config.get<string>('app.uploadDir', './uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  async saveFileForUser(
    user: AuthUser,
    file: Express.Multer.File,
    options: { businessId?: string; uploadContext?: string } = {},
  ): Promise<{ url: string; uploadToken: string }> {
    if (!file) {
      throw mediaUploadBadRequest(MediaUploadErrorCode.INVALID_IMAGE_DATA, 'File required');
    }

    const { policy, scope } = await this.assertUploadAuthorized(user, options);
    let normalized;
    try {
      normalized = await processUploadedImage(file.buffer, policy);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.IMAGE_PROCESSING_FAILED,
        'Unsupported or invalid image content',
      );
    }

    const filename = `${randomUUID()}${normalized.ext}`;
    const dir = this.getUploadDir();
    const filepath = join(dir, filename);

    try {
      await new Promise<void>((resolve, reject) => {
        const stream = createWriteStream(filepath);
        stream.write(normalized.data);
        stream.end();
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });
    } catch {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.IMAGE_PROCESSING_FAILED,
        'Unsupported or invalid image content',
      );
    }

    const url = `/uploads/${filename}`;
    const uploadToken = this.uploadReceipts.createReceipt(user, url, scope);
    return { url, uploadToken };
  }

  private async assertUploadAuthorized(
    user: AuthUser,
    options: { businessId?: string; uploadContext?: string },
  ): Promise<{ policy: ImageUploadPolicy; scope: UploadReceiptScope }> {
    const isPlatformStaff =
      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'CITY_ADMIN';

    const policy = RateLimitPolicy.UPLOAD;
    const windowMs = policy.windowSeconds * 1000;

    if (options.businessId) {
      await this.businessAccess.assertBusinessPermission(
        user,
        options.businessId,
        BusinessPermission.PHOTOS_EDIT,
      );
      const key = `upload:${options.businessId}:${user.id}`;
      try {
        await this.rateLimits.assertAllowed(key, policy.limit, windowMs);
        await this.rateLimits.recordHit(key, windowMs);
      } catch {
        throw mediaUploadBadRequest(
          MediaUploadErrorCode.UPLOAD_LIMIT_REACHED,
          'Upload quota exceeded for this business',
        );
      }
      return {
        policy: ImageUploadPolicyPreset.BUSINESS,
        scope: { kind: 'business', businessId: options.businessId },
      };
    }

    if (isPlatformStaff && options.uploadContext === PLATFORM_CATALOG_UPLOAD_CONTEXT) {
      const key = `upload:staff:${user.id}`;
      try {
        await this.rateLimits.assertAllowed(key, policy.limit, windowMs);
        await this.rateLimits.recordHit(key, windowMs);
      } catch {
        throw mediaUploadBadRequest(
          MediaUploadErrorCode.UPLOAD_LIMIT_REACHED,
          'Upload quota exceeded',
        );
      }
      return {
        policy: ImageUploadPolicyPreset.CATEGORY_ICON,
        scope: { kind: 'platform', uploadContext: PLATFORM_CATALOG_UPLOAD_CONTEXT },
      };
    }

    throw mediaUploadBadRequest(
      MediaUploadErrorCode.UPLOAD_CONTEXT_REQUIRED,
      'businessId or uploadContext is required for uploads',
    );
  }

  async attachToBusiness(
    user: AuthUser,
    businessId: string,
    imageUrl: string,
    options: { asCover?: boolean; locationId?: string | null; uploadToken?: string } = {},
  ) {
    await this.assertCanManage(user, businessId);
    assertAttachableLocalUploadPath(imageUrl);
    const uploadDir = this.getUploadDir();
    if (!localUploadFileExists(uploadDir, imageUrl)) {
      throw mediaUploadBadRequest(MediaUploadErrorCode.UPLOAD_NOT_FOUND, 'Upload not found');
    }
    await assertBusinessAttachOwnership(
      this.prisma,
      this.uploadReceipts,
      user,
      businessId,
      imageUrl,
      options.uploadToken,
    );

    await this.planLimits.assertCanAddPhoto(businessId);

    const resolvedLocationId = await resolveAttachLocationId(
      (args) => this.prisma.businessLocation.findFirst(args),
      businessId,
      options.locationId,
    );
    const asCover = options.asCover ?? false;
    assertBrandCoverOnly(asCover, resolvedLocationId);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { coverImageUrl: true },
    });
    const previousCover = business?.coverImageUrl ?? null;

    const image = await this.prisma.businessImage.create({
      data: {
        businessId,
        imageUrl,
        locationId: resolvedLocationId,
      },
    });

    try {
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
        if (previousCover && previousCover !== imageUrl) {
          await tryDeleteLocalUploadIfUnreferenced(this.prisma, uploadDir, previousCover);
        }
      } else {
        await this.auditLog.recordBusinessAction(user, businessId, {
          action: AuditAction.BUSINESS_PHOTO_ADD,
          resourceType: AuditResourceType.BUSINESS_IMAGE,
          resourceId: image.id,
          metadata: { imageId: image.id },
        });
      }
    } catch (e) {
      await this.prisma.businessImage.delete({ where: { id: image.id } }).catch(() => undefined);
      throw e;
    }

    return image;
  }

  async listBusinessImages(
    user: AuthUser,
    businessId: string,
    filter: ListBusinessImagesFilter = {},
  ) {
    await this.assertCanManage(user, businessId);
    if (filter.locationId?.trim()) {
      await resolveAttachLocationId(
        (args) => this.prisma.businessLocation.findFirst(args),
        businessId,
        filter.locationId,
      );
    }
    const where = buildBusinessImagesListWhere(businessId, filter);
    return this.prisma.businessImage.findMany({
      where,
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
    const deletedUrl = image.imageUrl;
    const wasCover = business?.coverImageUrl === deletedUrl;

    await this.prisma.businessImage.delete({ where: { id: imageId } });

    await this.auditLog.recordBusinessAction(user, businessId, {
      action: AuditAction.BUSINESS_PHOTO_DELETE,
      resourceType: AuditResourceType.BUSINESS_IMAGE,
      resourceId: imageId,
      metadata: { imageId },
    });

    if (wasCover) {
      const next = await this.prisma.businessImage.findFirst({
        where: { businessId, locationId: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      const newCover = next?.imageUrl ?? null;
      await this.prisma.business.update({
        where: { id: businessId },
        data: { coverImageUrl: newCover },
      });
    }

    await tryDeleteLocalUploadIfUnreferenced(this.prisma, this.getUploadDir(), deletedUrl);

    return { success: true };
  }

  async setBusinessCover(user: AuthUser, businessId: string, imageId: string) {
    await this.assertCanManage(user, businessId);
    const image = await this.prisma.businessImage.findFirst({
      where: { id: imageId, businessId },
    });
    if (!image) throw new NotFoundException('Image not found');
    assertImageEligibleForBrandCover(image.locationId);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { coverImageUrl: true },
    });
    const previousCover = business?.coverImageUrl ?? null;

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

    if (previousCover && previousCover !== image.imageUrl) {
      await tryDeleteLocalUploadIfUnreferenced(this.prisma, this.getUploadDir(), previousCover);
    }

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
