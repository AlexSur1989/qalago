import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CityScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async resolveCityId(params: { cityId?: string; citySlug?: string }): Promise<string> {
    if (params.cityId) {
      const city = await this.prisma.city.findFirst({
        where: { id: params.cityId, isActive: true },
      });
      if (!city) {
        throw new NotFoundException('City not found');
      }
      return city.id;
    }

    const slug = params.citySlug ?? this.config.get<string>('app.defaultCitySlug', 'uralsk');
    const city = await this.prisma.city.findFirst({
      where: { slug, isActive: true },
    });
    if (!city) {
      throw new NotFoundException(`City not found: ${slug}`);
    }
    return city.id;
  }

  async resolveAdminCityId(user: AuthUser, citySlug?: string): Promise<string | undefined> {
    if (user.role === UserRole.CITY_ADMIN) {
      const record = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { managedCityId: true },
      });
      if (!record?.managedCityId) {
        throw new ForbiddenException('City admin has no assigned city');
      }
      return record.managedCityId;
    }

    if (citySlug) {
      return this.resolveCityId({ citySlug });
    }

    return undefined;
  }

  async assertBusinessInAdminScope(user: AuthUser, businessCityId: string) {
    if (user.role !== UserRole.CITY_ADMIN) return;

    const managedCityId = await this.resolveAdminCityId(user);
    if (managedCityId && managedCityId !== businessCityId) {
      throw new ForbiddenException('Not allowed to manage businesses in this city');
    }
  }
}
