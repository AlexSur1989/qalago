import {
  mapPublicBusinessListItems,
  stripInternalBusinessScalars,
  toPublicBusinessDetailDto,
} from './public-business.dto.mapper';
import { mapPublicReviews, toPublicReviewDto } from './public-review.dto.mapper';
import { mapPublicPromotionItems } from './public-promotion.dto.mapper';

describe('KZ-C.3 public DTO mappers', () => {
  const internalBusiness = {
    id: 'b1',
    ownerId: 'owner-secret',
    title: 'Cafe',
    slug: 'cafe',
    status: 'ACTIVE',
    isFeatured: true,
    featuredSlot: 3,
    planTier: 'VIP',
    planExpiresAt: new Date('2030-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    categoryId: 'c1',
    phone: '+7',
  };

  it('stripInternalBusinessScalars removes monetization and ownership fields', () => {
    const out = stripInternalBusinessScalars(internalBusiness);
    expect(out).not.toHaveProperty('ownerId');
    expect(out).not.toHaveProperty('planTier');
    expect(out).not.toHaveProperty('planExpiresAt');
    expect(out).not.toHaveProperty('status');
    expect(out).not.toHaveProperty('isFeatured');
    expect(out).not.toHaveProperty('featuredSlot');
    expect(out).not.toHaveProperty('createdAt');
    expect(out).not.toHaveProperty('updatedAt');
    expect(out.id).toBe('b1');
  });

  it('mapPublicBusinessListItems produces card DTO without internal scalars', () => {
    const [card] = mapPublicBusinessListItems([internalBusiness]);
    expect(card.id).toBe('b1');
    expect(card).not.toHaveProperty('ownerId');
    expect(card).not.toHaveProperty('planTier');
  });

  it('toPublicBusinessDetailDto omits internal scalars on detail payload', () => {
    const detail = toPublicBusinessDetailDto({
      ...internalBusiness,
      description: 'Desc',
      subcategories: [],
      reviewsPreview: { items: [], totalCount: 0 },
    });
    expect(detail.description).toBe('Desc');
    expect(detail).not.toHaveProperty('ownerId');
    expect(detail).not.toHaveProperty('planTier');
  });

  it('toPublicReviewDto exposes author only (no userId)', () => {
    const dto = toPublicReviewDto({
      id: 'r1',
      businessId: 'b1',
      userId: 'u-secret',
      rating: 5,
      text: 'Great',
      createdAt: new Date('2024-01-01'),
      ownerReply: null,
      ownerReplyAt: null,
      user: { id: 'u-secret', name: 'Ali', avatarUrl: null },
    });
    expect(dto.author).toEqual({ name: 'Ali', avatarUrl: null });
    expect(dto).not.toHaveProperty('userId');
    expect(dto).not.toHaveProperty('user');
    expect(dto).not.toHaveProperty('moderationHidden');
  });

  it('mapPublicReviews maps list items', () => {
    const items = mapPublicReviews([
      {
        id: 'r1',
        businessId: 'b1',
        userId: 'u1',
        rating: 4,
        text: null,
        createdAt: new Date(),
        ownerReply: null,
        ownerReplyAt: null,
        user: { id: 'u1', name: 'Guest' },
      },
    ]);
    expect(items[0]).not.toHaveProperty('userId');
    expect(items[0].author.name).toBe('Guest');
  });

  it('mapPublicPromotionItems strips promotion workflow and nested business plan fields', () => {
    const [item] = mapPublicPromotionItems([
      {
        id: 'p1',
        businessId: 'b1',
        title: 'Sale',
        description: null,
        imageUrl: null,
        discountText: '-10%',
        startDate: null,
        endDate: null,
        status: 'ACTIVE',
        moderationHidden: false,
        createdAt: new Date(),
        business: {
          id: 'b1',
          title: 'Cafe',
          slug: 'cafe',
          ownerId: 'o1',
          planTier: 'VIP',
          planExpiresAt: new Date(),
          phone: '+7',
        },
      },
    ]);
    expect(item.title).toBe('Sale');
    expect(item).not.toHaveProperty('status');
    expect(item).not.toHaveProperty('moderationHidden');
    expect(item.business).toBeDefined();
    expect(item.business).not.toHaveProperty('ownerId');
    expect(item.business).not.toHaveProperty('planTier');
    expect(item.business).not.toHaveProperty('planExpiresAt');
  });
});
