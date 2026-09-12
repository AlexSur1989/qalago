import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload.type';
import {
  StaffPermission,
  assertStaffPermission,
  isStaffRole,
} from '../utils/staff-access.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StaffPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  hasPermission(user: Pick<AuthUser, 'role'>, permission: StaffPermission): boolean {
    if (!isStaffRole(user.role)) {
      return false;
    }
    return assertStaffPermission(user.role as UserRole, permission);
  }

  assertPermission(user: AuthUser, permission: StaffPermission): void {
    if (!this.hasPermission(user, permission)) {
      throw new ForbiddenException('Staff permission denied');
    }
  }

  async assertActiveStaff(userId: string, role: UserRole): Promise<void> {
    if (!isStaffRole(role)) {
      return;
    }
    const row = await this.prisma.staffAccess.findUnique({
      where: { userId },
      select: { isActive: true },
    });
    if (!row?.isActive) {
      throw new ForbiddenException('Staff access disabled');
    }
  }

  assertNoSelfTarget(actorId: string, targetUserId: string, action: string): void {
    if (actorId === targetUserId) {
      throw new ForbiddenException(`Cannot ${action} on your own staff account`);
    }
  }
}
