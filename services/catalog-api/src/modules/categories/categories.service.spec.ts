import { CategoriesService } from './categories.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CategoriesService', () => {
  const prisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    categoryCityOrder: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      createMany: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaService;

  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-1'),
  } as unknown as CityScopeService;

  const service = new CategoriesService(prisma, cityScope);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies city-specific sort order in findAll', async () => {
    (prisma.category.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'cat-a',
        title: 'A',
        slug: 'a',
        icon: null,
        sortOrder: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-b',
        title: 'B',
        slug: 'b',
        icon: null,
        sortOrder: 20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    (prisma.categoryCityOrder.findMany as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-b', sortOrder: 1, isHidden: false },
      { categoryId: 'cat-a', sortOrder: 2, isHidden: false },
    ]);

    const result = await service.findAll({ citySlug: 'aktobe' });

    expect(cityScope.resolveCityId).toHaveBeenCalledWith({ citySlug: 'aktobe' });
    expect(result.map((item) => item.id)).toEqual(['cat-b', 'cat-a']);
    expect(result[0].sortOrder).toBe(1);
    expect(result[1].sortOrder).toBe(2);
  });

  it('hides categories marked isHidden for the city', async () => {
    (prisma.category.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'cat-a',
        title: 'A',
        slug: 'a',
        icon: null,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-b',
        title: 'B',
        slug: 'b',
        icon: null,
        sortOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    (prisma.categoryCityOrder.findMany as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-b', sortOrder: 2, isHidden: true },
    ]);

    const result = await service.findAll({ citySlug: 'uralsk' });

    expect(result.map((item) => item.id)).toEqual(['cat-a']);
  });

  it('bootstraps category order for a new city from source city', async () => {
    (prisma.category.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'cat-a',
        title: 'A',
        slug: 'a',
        sortOrder: 1,
        isActive: true,
      },
    ]);
    (prisma.city.findFirst as jest.Mock).mockResolvedValue({ id: 'city-source' });
    (prisma.categoryCityOrder.findMany as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-a', sortOrder: 5, isHidden: false },
    ]);
    (prisma.categoryCityOrder.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    const result = await service.bootstrapCityCategories('city-new', 'uralsk');

    expect(result.created).toBe(1);
    expect(prisma.categoryCityOrder.createMany).toHaveBeenCalledWith({
      data: [
        {
          cityId: 'city-new',
          categoryId: 'cat-a',
          sortOrder: 5,
          isHidden: false,
        },
      ],
      skipDuplicates: true,
    });
  });
});
