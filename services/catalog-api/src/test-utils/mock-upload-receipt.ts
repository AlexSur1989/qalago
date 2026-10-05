import { UploadReceiptService } from '../common/media-upload/upload-receipt.service';

export function createTestUploadReceiptService(): UploadReceiptService {
  return new UploadReceiptService({
    get: (key: string) => {
      if (key === 'app.jwtSecret') return 'dev-secret-change-me-32-chars-minimum!!';
      if (key === 'app.uploadDir') return './uploads';
      if (key === 'app.redisUrl') return '';
      return undefined;
    },
    getOrThrow: (key: string) => {
      if (key === 'app.jwtSecret') return 'dev-secret-change-me-32-chars-minimum!!';
      throw new Error(`missing ${key}`);
    },
  } as never);
}
