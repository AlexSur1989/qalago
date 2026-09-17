import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlidingWindowRateLimitService } from '../../common/services/sliding-window-rate-limit.service';

@Injectable()
export class GeocodingRateLimitService {
  constructor(
    private readonly limiter: SlidingWindowRateLimitService,
    private readonly config: ConfigService,
  ) {}

  assertAllowed(userId: string, ip: string): void {
    const userWindowMs =
      (this.config.get<number>('app.geocodingUserWindowSeconds') ?? 60) * 1000;
    const userLimit = this.config.get<number>('app.geocodingUserLimit') ?? 30;
    this.limiter.assertAllowed(
      `geocoding:user:${userId}`,
      userLimit,
      userWindowMs,
      'Too many geocoding requests',
    );

    const ipWindowMs = (this.config.get<number>('app.geocodingIpWindowSeconds') ?? 60) * 1000;
    const ipLimit = this.config.get<number>('app.geocodingIpLimit') ?? 60;
    this.limiter.assertAllowed(
      `geocoding:ip:${ip}`,
      ipLimit,
      ipWindowMs,
      'Too many geocoding requests',
    );
  }
}
