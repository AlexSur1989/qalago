import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

type WindowEntry = { timestamps: number[] };

@Injectable()
export class AdEventsRateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, WindowEntry>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.ip ??
      req.socket.remoteAddress ??
      'unknown';

    const now = Date.now();
    let entry = this.windows.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      this.windows.set(ip, entry);
    }

    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length >= MAX_REQUESTS) {
      throw new HttpException(
        { message: 'Too many ad event requests', code: 'RATE_LIMITED' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.timestamps.push(now);
    return true;
  }
}
