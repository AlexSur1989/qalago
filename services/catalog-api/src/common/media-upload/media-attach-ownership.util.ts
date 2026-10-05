import { UserRole } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  isLegacyLocalUploadPath,
  isTrustedMediaUrlForWrite,
} from './trusted-media-url.util';
import { MediaUploadErrorCode, mediaUploadBadRequest } from './media-upload.errors';
import { UploadReceiptService, UploadReceiptScope } from './upload-receipt.service';
import { countMediaUrlReferences } from './media-url-reference.util';

function isPlatformStaff(user: AuthUser): boolean {
  return (
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.CITY_ADMIN
  );
}

async function businessAlreadyReferencesUrl(
  prisma: PrismaService,
  businessId: string,
  url: string,
): Promise<boolean> {
  const [imageCount, business] = await Promise.all([
    prisma.businessImage.count({ where: { businessId, imageUrl: url } }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { coverImageUrl: true },
    }),
  ]);
  return imageCount > 0 || business?.coverImageUrl === url;
}

/**
 * Proves the caller may attach a local upload URL to a business gallery/cover.
 */
export async function assertBusinessAttachOwnership(
  prisma: PrismaService,
  receiptService: UploadReceiptService,
  user: AuthUser,
  businessId: string,
  imageUrl: string,
  uploadToken: string | undefined,
): Promise<void> {
  if (isTrustedMediaUrlForWrite(imageUrl)) {
    receiptService.assertValidReceipt(user, imageUrl, uploadToken, {
      kind: 'business',
      businessId,
    });
    return;
  }

  if (!isLegacyLocalUploadPath(imageUrl)) {
    throw mediaUploadBadRequest(
      MediaUploadErrorCode.UNTRUSTED_MEDIA_URL,
      'Untrusted media URL',
    );
  }

  if (isPlatformStaff(user)) {
    return;
  }

  if (await businessAlreadyReferencesUrl(prisma, businessId, imageUrl)) {
    return;
  }

  const refs = await countMediaUrlReferences(prisma, imageUrl);
  if (refs > 0) {
    throw mediaUploadBadRequest(
      MediaUploadErrorCode.UNTRUSTED_MEDIA_URL,
      'Media URL belongs to another resource',
    );
  }

  throw mediaUploadBadRequest(
    MediaUploadErrorCode.UPLOAD_RECEIPT_REQUIRED,
    'Upload receipt required for new legacy attach',
  );
}

export function assertPlatformMediaWriteOwnership(
  receiptService: UploadReceiptService,
  user: AuthUser,
  url: string,
  uploadToken: string | undefined,
  uploadContext: string,
): void {
  receiptService.assertValidReceipt(user, url, uploadToken, {
    kind: 'platform',
    uploadContext,
  });
}

export function assertBusinessMediaWriteOwnership(
  receiptService: UploadReceiptService,
  user: AuthUser,
  businessId: string,
  url: string,
  uploadToken: string | undefined,
): void {
  receiptService.assertValidReceipt(user, url, uploadToken, {
    kind: 'business',
    businessId,
  });
}

export type MediaUploadScope = UploadReceiptScope;
