import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: {
    review: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      review: { findMany: jest.fn() },
    };
    service = new ReviewsService(
      prisma as unknown as PrismaService,
      { create: jest.fn() } as never,
    );
  });

  describe('findByUser', () => {
    it('returns reviews for user with business info', async () => {
      const rows = [{ id: 'r1', rating: 5, business: { id: 'b1', title: 'Cafe' } }];
      prisma.review.findMany.mockResolvedValue(rows);

      await expect(service.findByUser('user-1')).resolves.toEqual(rows);
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          business: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
