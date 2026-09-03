import { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  phone: string;
  role: UserRole;
};

export type AuthUser = JwtPayload & {
  id: string;
};
