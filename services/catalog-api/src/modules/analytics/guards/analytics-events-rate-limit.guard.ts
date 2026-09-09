import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { SlidingWindowRateLimitService } from '../../../common/services/sliding-window-rate-limit.service';
import { resolveRequestIp } from '../../../common/utils/request-ip.util';

@Injectable()
export class AnalyticsEventsRateLimitGuard implements CanActivate {
  constructor(
    private readonly limiter: SlidingWindowRateLimitService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = resolveRequestIp(req);
    const limit = this.config.get<number>('app.analyticsEventsIpLimit') ?? 300;
    const windowMs =
      (this.config.get<number>('app.analyticsEventsWindowSeconds') ?? 60) * 1000;

    try {
      this.limiter.assertAllowed(
        `analytics-events:ip:${ip}`,
        limit,
        windowMs,
        'Too many requests',
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { message: 'Too many requests', statusCode: HttpStatus.TOO_MANY_REQUESTS },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
