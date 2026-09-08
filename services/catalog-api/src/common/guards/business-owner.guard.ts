import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/jwt-payload.type';
import { isGlobalAdmin, isCityAdmin } from '../utils/system-access.util';

@Injectable()
export class BusinessOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params: Record<string, string>;
      body: Record<string, string>;
    }>();
    const user = request.user;
    if (!user) throw new ForbiddenException();

    if (isGlobalAdmin(user) || isCityAdmin(user)) {
      return true;
    }

    const businessId =
      request.params.businessId ??
      request.params.id ??
      request.body?.businessId;

    if (!businessId) {
      throw new ForbiddenException('Business id required');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId !== user.id) {
      throw new ForbiddenException('Not business owner');
    }
    return true;
  }
}
