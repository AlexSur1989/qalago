import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type WindowEntry = { timestamps: number[] };

/**
 * In-process sliding-window rate limiter.
 * Replaceable with Redis-backed implementation in a future stage.
 */
@Injectable()
export class SlidingWindowRateLimitService {
  private readonly windows = new Map<string, WindowEntry>();

  assertAllowed(key: string, limit: number, windowMs: number, message = 'Too many requests'): void {
    const now = Date.now();
    let entry = this.windows.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.windows.set(key, entry);
    }

    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length >= limit) {
      throw new HttpException(
        { message, statusCode: HttpStatus.TOO_MANY_REQUESTS },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.timestamps.push(now);
  }

  /** Read-only check without recording a hit (for cooldown gates). */
  getRecentCount(key: string, windowMs: number): number {
    const now = Date.now();
    const entry = this.windows.get(key);
    if (!entry) return 0;
    return entry.timestamps.filter((t) => now - t < windowMs).length;
  }

  getLastTimestamp(key: string): number | null {
    const entry = this.windows.get(key);
    if (!entry || entry.timestamps.length === 0) return null;
    return Math.max(...entry.timestamps);
  }

  reset(key: string): void {
    this.windows.delete(key);
  }
}
