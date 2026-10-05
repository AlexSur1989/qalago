import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { AuthUser } from '../types/jwt-payload.type';
import { MediaUploadErrorCode, mediaUploadBadRequest } from './media-upload.errors';
const RECEIPT_VERSION = 1;
const DEFAULT_TTL_MS = 15 * 60 * 1000;

export type UploadReceiptScope =
  | { kind: 'business'; businessId: string }
  | { kind: 'platform'; uploadContext: string };

type ReceiptPayload = {
  v: number;
  url: string;
  sub: string;
  businessId?: string;
  uploadContext?: string;
  exp: number;
  jti: string;
};

@Injectable()
export class UploadReceiptService {
  private readonly logger = new Logger(UploadReceiptService.name);
  /** Consumed jti → expiry timestamp (in-memory single-use tracking). */
  private readonly consumed = new Map<string, number>();
  private redis: import('ioredis').default | null = null;
  private redisInitAttempted = false;

  constructor(private readonly config: ConfigService) {}

  createReceipt(user: AuthUser, url: string, scope: UploadReceiptScope): string {
    const exp = Date.now() + DEFAULT_TTL_MS;
    const payload: ReceiptPayload = {
      v: RECEIPT_VERSION,
      url,
      sub: user.id,
      exp,
      jti: randomUUID(),
      ...(scope.kind === 'business'
        ? { businessId: scope.businessId }
        : { uploadContext: scope.uploadContext }),
    };
    return this.sign(payload);
  }

  /**
   * Verifies receipt and marks it consumed (single-use per jti).
   */
  assertValidReceipt(
    user: AuthUser,
    url: string,
    uploadToken: string | undefined,
    scope: UploadReceiptScope,
  ): void {
    if (!uploadToken?.trim()) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.UPLOAD_RECEIPT_REQUIRED,
        'Upload receipt required',
      );
    }
    const payload = this.parseAndVerify(uploadToken.trim());
    if (!payload) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID,
        'Invalid upload receipt',
      );
    }
    if (payload.sub !== user.id) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID,
        'Invalid upload receipt',
      );
    }
    if (payload.url !== url) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID,
        'Upload receipt does not match image URL',
      );
    }
    if (Date.now() > payload.exp) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID,
        'Upload receipt expired',
      );
    }
    if (scope.kind === 'business') {
      if (payload.businessId !== scope.businessId || payload.uploadContext) {
        throw mediaUploadBadRequest(
          MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID,
          'Upload receipt business mismatch',
        );
      }
    } else {
      if (payload.uploadContext !== scope.uploadContext || payload.businessId) {
        throw mediaUploadBadRequest(
          MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID,
          'Upload receipt context mismatch',
        );
      }
      const staff =
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN' ||
        user.role === 'CITY_ADMIN';
      if (!staff) {
        throw mediaUploadBadRequest(
          MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID,
          'Invalid upload receipt',
        );
      }
    }
    if (!this.consumeOnce(payload.jti, payload.exp)) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID,
        'Upload receipt already used',
      );
    }
  }

  private sign(payload: ReceiptPayload): string {
    const secret = this.config.getOrThrow<string>('app.jwtSecret');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  private parseAndVerify(token: string): ReceiptPayload | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const secret = this.config.getOrThrow<string>('app.jwtSecret');
    const expected = createHmac('sha256', secret).update(body).digest('base64url');
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    } catch {
      return null;
    }
    try {
      const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ReceiptPayload;
      if (parsed.v !== RECEIPT_VERSION || typeof parsed.url !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private consumeOnce(jti: string, expMs: number): boolean {
    this.pruneConsumed();
    if (this.consumed.has(jti)) return false;
    this.consumed.set(jti, expMs);
    void this.consumeOnceRedis(jti, expMs);
    return true;
  }

  private pruneConsumed(): void {
    const now = Date.now();
    for (const [jti, exp] of this.consumed.entries()) {
      if (exp <= now) this.consumed.delete(jti);
    }
  }

  private async consumeOnceRedis(jti: string, expMs: number): Promise<void> {
    const redis = await this.getRedis();
    if (!redis) return;
    const ttl = Math.max(1000, expMs - Date.now());
    const key = `upload-receipt:${jti}`;
    try {
      const ok = await redis.set(key, '1', 'PX', ttl, 'NX');
      if (ok !== 'OK') {
        this.consumed.delete(jti);
      }
    } catch (err) {
      this.logger.warn(`Upload receipt Redis consume failed: ${String(err)}`);
    }
  }

  private async getRedis(): Promise<import('ioredis').default | null> {
    if (this.redisInitAttempted) return this.redis;
    this.redisInitAttempted = true;
    const url = this.config.get<string>('app.redisUrl', '')?.trim();
    if (!url) return null;
    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      await this.redis.connect();
    } catch {
      this.redis = null;
    }
    return this.redis;
  }
}
