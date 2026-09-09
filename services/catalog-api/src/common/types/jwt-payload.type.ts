import { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  phone?: string | null;
  role: UserRole;
};

export type AuthUser = JwtPayload & {
  id: string;
};
