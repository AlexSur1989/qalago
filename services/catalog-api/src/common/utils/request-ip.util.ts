import { Request } from 'express';

/** Client IP for rate limiting (respects X-Forwarded-For when present). */
export function resolveRequestIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}
