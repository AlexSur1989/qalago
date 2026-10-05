import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { staffUnauthorized, StaffAuthErrorCode } from '../errors/staff-auth.errors';
import { isStaffRole } from '../utils/staff-access.util';

@Injectable()
export class StaffSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async assertStaffSessionActive(
    sessionId: string | undefined,
    userId: string,
  ): Promise<{ mfaEnrollOnly: boolean }> {
    if (!sessionId) {
      throw staffUnauthorized(
        StaffAuthErrorCode.STAFF_SESSION_REVOKED,
        'Staff session binding required',
      );
    }
    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, userId },
      select: { revokedAt: true, expiresAt: true, mfaEnrollOnly: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw staffUnauthorized(
        StaffAuthErrorCode.STAFF_SESSION_REVOKED,
        'Staff session revoked or expired',
      );
    }
    return { mfaEnrollOnly: session.mfaEnrollOnly };
  }

  async assertStaffAccessActive(userId: string, role: UserRole): Promise<UserRole> {
    if (!isStaffRole(role)) {
      throw staffUnauthorized(
        StaffAuthErrorCode.STAFF_ACCESS_REQUIRED,
        'Staff access required',
      );
    }
    const staff = await this.prisma.staffAccess.findUnique({
      where: { userId },
      select: { isActive: true, staffRole: true },
    });
    if (!staff?.isActive) {
      throw staffUnauthorized(
        StaffAuthErrorCode.STAFF_ACCESS_DISABLED,
        'Staff access disabled',
      );
    }
    return staff.staffRole;
  }

  async resolveStaffRoleForRefresh(userId: string): Promise<UserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });
    if (!user?.isActive) {
      throw staffUnauthorized(StaffAuthErrorCode.STAFF_ACCESS_DISABLED, 'User inactive');
    }
    if (!isStaffRole(user.role)) {
      return user.role;
    }
    return this.assertStaffAccessActive(userId, user.role);
  }
}
