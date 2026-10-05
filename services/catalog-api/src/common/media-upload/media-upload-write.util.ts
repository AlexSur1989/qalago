import { ConfigService } from '@nestjs/config';
import { AuthUser } from '../types/jwt-payload.type';
import { assertTrustedMediaUrlWriteWithLocalFile } from './trusted-media-url.util';
import { UploadReceiptService } from './upload-receipt.service';
import {
  assertBusinessMediaWriteOwnership,
  assertPlatformMediaWriteOwnership,
} from './media-attach-ownership.util';
import { PLATFORM_CATALOG_UPLOAD_CONTEXT } from './upload-context.constants';

export function validateMediaUrlWrite(
  config: ConfigService,
  url: string | undefined | null,
): void {
  const uploadDir = config.get<string>('app.uploadDir', './uploads');
  assertTrustedMediaUrlWriteWithLocalFile(uploadDir, url);
}

/** Canonical new writes require a matching single-use upload receipt. */
export function validateOwnedMediaUrlWrite(
  config: ConfigService,
  receiptService: UploadReceiptService,
  user: AuthUser,
  url: string | undefined | null,
  uploadToken: string | undefined,
  scope:
    | { kind: 'business'; businessId: string }
    | { kind: 'platform'; uploadContext: string },
): void {
  if (url == null || url === '') return;
  validateMediaUrlWrite(config, url);
  if (scope.kind === 'business') {
    assertBusinessMediaWriteOwnership(receiptService, user, scope.businessId, url, uploadToken);
  } else {
    assertPlatformMediaWriteOwnership(
      receiptService,
      user,
      url,
      uploadToken,
      scope.uploadContext ?? PLATFORM_CATALOG_UPLOAD_CONTEXT,
    );
  }
}
