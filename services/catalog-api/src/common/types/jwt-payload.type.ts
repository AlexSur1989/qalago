import { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  phone?: string | null;
  role: UserRole;
  /** Bound AuthSession id — required for staff access tokens. */
  sid?: string;
  /** Unix seconds when primary auth occurred. */
  authAt?: number;
  /** Unix seconds when step-up (OTP re-verify) last succeeded. */
  stepUpAt?: number;
};

export type AuthUser = JwtPayload & {
  id: string;
};
