import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  isCityAdmin,
  isGlobalAdmin,
  isSuperAdmin,
} from '../utils/system-access.util';

@Injectable()
export class SystemAccessService {
  constructor(private readonly prisma: PrismaService) {}

  isSuperAdmin(user: AuthUser): boolean {
    return isSuperAdmin(user);
  }

  isGlobalAdmin(user: AuthUser): boolean {
    return isGlobalAdmin(user);
  }

  isCityAdmin(user: AuthUser): boolean {
    return isCityAdmin(user);
  }

  assertSuperAdmin(user: AuthUser): void {
    if (!this.isSuperAdmin(user)) {
      throw new ForbiddenException('Super admin access required');
    }
  }

  assertGlobalAdmin(user: AuthUser): void {
    if (!this.isGlobalAdmin(user)) {
      throw new ForbiddenException('Global admin access required');
    }
  }

  assertGlobalOrCityAdmin(user: AuthUser): void {
    if (!this.isGlobalAdmin(user) && !this.isCityAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  async assertCanDemoteSuperAdmin(targetUserId: string): Promise<void> {
    const otherCount = await this.prisma.user.count({
      where: {
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        id: { not: targetUserId },
      },
    });
    if (otherCount === 0) {
      throw new ForbiddenException('Cannot demote the last super administrator');
    }
  }

  async validateCityAdminAssignment(managedCityId?: string | null): Promise<string> {
    if (!managedCityId) {
      throw new BadRequestException('managedCityId is required for CITY_ADMIN');
    }
    const city = await this.prisma.city.findUnique({
      where: { id: managedCityId },
      select: { id: true },
    });
    if (!city) {
      throw new BadRequestException('Invalid managedCityId');
    }
    return city.id;
  }

  resolveManagedCityIdForRole(
    role: UserRole,
    managedCityId?: string | null,
  ): string | null {
    if (role === UserRole.CITY_ADMIN) {
      return managedCityId ?? null;
    }
    return null;
  }
}
