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

  async getCityAdminScopeCityIds(userId: string): Promise<string[]> {
    const scoped = await this.prisma.staffCityScope.findMany({
      where: { userId },
      select: { cityId: true },
    });
    if (scoped.length > 0) {
      return scoped.map((s) => s.cityId);
    }
    const record = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { managedCityId: true },
    });
    if (record?.managedCityId) {
      return [record.managedCityId];
    }
    return [];
  }

  async resolveAdminCityId(user: AuthUser, citySlug?: string): Promise<string | undefined> {
    if (user.role === UserRole.CITY_ADMIN) {
      const cityIds = await this.getCityAdminScopeCityIds(user.id);
      if (!cityIds.length) {
        throw new ForbiddenException('City admin has no assigned city');
      }
      if (citySlug) {
        const requestedId = await this.resolveCityId({ citySlug });
        if (!cityIds.includes(requestedId)) {
          throw new ForbiddenException('Not allowed to access this city');
        }
        return requestedId;
      }
      return cityIds[0];
    }

    if (citySlug) {
      return this.resolveCityId({ citySlug });
    }

    return undefined;
  }

  async assertBusinessInAdminScope(user: AuthUser, businessCityId: string) {
    if (user.role !== UserRole.CITY_ADMIN) return;

    const cityIds = await this.getCityAdminScopeCityIds(user.id);
    if (!cityIds.includes(businessCityId)) {
      throw new ForbiddenException('Not allowed to manage businesses in this city');
    }
  }

  async assertCityInAdminScope(user: AuthUser, cityId: string | null | undefined) {
    if (user.role !== UserRole.CITY_ADMIN || !cityId) return;
    const cityIds = await this.getCityAdminScopeCityIds(user.id);
    if (!cityIds.includes(cityId)) {
      throw new ForbiddenException('Not allowed to access resources in this city');
    }
  }
}
