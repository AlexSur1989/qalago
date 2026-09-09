import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type WindowEntry = { timestamps: number[] };

@Injectable()
export class OnboardingRateLimitService {
  private readonly windows = new Map<string, WindowEntry>();

  constructor(private readonly config: ConfigService) {}

  assertApplicationCreate(userId: string): void {
    this.assertAllowed(
      `application-create:${userId}`,
      this.config.get<number>('app.businessApplicationCreateLimit') ?? 5,
      this.config.get<number>('app.businessApplicationCreateWindowSeconds') ?? 3600,
    );
  }

  assertApplicationSubmit(userId: string): void {
    this.assertAllowed(
      `application-submit:${userId}`,
      this.config.get<number>('app.businessApplicationSubmitLimit') ?? 10,
      this.config.get<number>('app.businessApplicationSubmitWindowSeconds') ?? 3600,
    );
  }

  assertOwnershipClaimCreate(userId: string): void {
    this.assertAllowed(
      `ownership-claim-create:${userId}`,
      this.config.get<number>('app.ownershipClaimCreateLimit') ?? 5,
      this.config.get<number>('app.ownershipClaimCreateWindowSeconds') ?? 3600,
    );
  }

  private assertAllowed(key: string, limit: number, windowSeconds: number): void {
    const windowMs = Math.max(1, windowSeconds) * 1000;
    const now = Date.now();
    let entry = this.windows.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.windows.set(key, entry);
    }

    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length >= limit) {
      throw new HttpException(
        { message: 'Too many requests', statusCode: HttpStatus.TOO_MANY_REQUESTS },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.timestamps.push(now);
  }
}
