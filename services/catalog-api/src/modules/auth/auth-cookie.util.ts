import { Request, Response } from 'express';
import { isProductionNodeEnv } from '../../common/utils/production-config.util';

export const REFRESH_COOKIE_NAME = 'qalago_refresh';

export function readRefreshToken(req: Request): string | undefined {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME];
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

export function setRefreshCookie(res: Response, refreshToken: string, req: Request): void {
  const secure = isProductionNodeEnv(process.env.NODE_ENV);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
}
