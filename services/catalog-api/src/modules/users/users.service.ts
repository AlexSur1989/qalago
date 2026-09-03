import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        preferredCityId: true,
        isActive: true,
        createdAt: true,
        preferredCity: {
          select: { id: true, slug: true, nameRu: true, nameKk: true },
        },
        managedCity: {
          select: { id: true, slug: true, nameRu: true, nameKk: true },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    if (dto.preferredCityId) {
      const city = await this.prisma.city.findFirst({
        where: { id: dto.preferredCityId, isActive: true },
      });
      if (!city) {
        throw new NotFoundException('Preferred city not found');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        preferredCityId: true,
      },
    });
  }
}
