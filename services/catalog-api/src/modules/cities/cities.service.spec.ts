import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { cityDisplayName } from '../../common/localized-content';
import { CitiesService } from './cities.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CitiesService', () => {
  const prisma = {
    city: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const service = new CitiesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes RU and KK city display names', () => {
    expect(cityDisplayName({ nameRu: 'Уральск', nameKk: 'Орал' }, 'kk')).toBe('Орал');
    expect(cityDisplayName({ nameRu: 'Уральск', nameKk: null }, 'kk')).toBe('Уральск');
  });

  it('throws ConflictException when slug already exists', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });
    (prisma.city.create as jest.Mock).mockRejectedValue(error);

    await expect(
      service.create({
        slug: 'astana',
        nameRu: 'Астана',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
