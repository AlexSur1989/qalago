import { describe, expect, it } from 'vitest';
import {
  buildPromotionUpdateBody,
  buildServiceItemUpdateBody,
  canEditPromotion,
  canEditServiceItem,
  promotionEditFormFromRow,
  serviceItemEditFormFromRow,
} from './owner-content-edit';

describe('owner-content-edit service item', () => {
  const row = {
    id: 'i1',
    title: 'Borscht',
    titleKk: 'Борщ KK',
    description: 'Hot soup',
    descriptionKk: 'Сорпа',
    price: '1200',
    sortOrder: 0,
    isActive: true,
    sectionId: 'g1',
  };

  it('prefills form from row including KK fields', () => {
    expect(serviceItemEditFormFromRow(row)).toEqual({
      title: 'Borscht',
      description: 'Hot soup',
      titleKk: 'Борщ KK',
      descriptionKk: 'Сорпа',
      price: '1200',
      groupId: 'g1',
      isActive: true,
    });
  });

  it('update sends primary and KK independently', () => {
    const body = buildServiceItemUpdateBody({
      title: 'New title',
      description: 'New desc',
      titleKk: '',
      descriptionKk: 'KK only',
      price: '900',
      groupId: '',
      isActive: false,
    });
    expect(body).toEqual({
      title: 'New title',
      description: 'New desc',
      titleKk: '',
      descriptionKk: 'KK only',
      price: '900',
      groupId: null,
      isActive: false,
    });
  });

  it('permission gating helper', () => {
    expect(canEditServiceItem(true)).toBe(true);
    expect(canEditServiceItem(false)).toBe(false);
  });
});

describe('owner-content-edit promotion', () => {
  const promo = {
    id: 'p1',
    title: 'Sale',
    titleKk: 'Жеңілдік',
    description: 'Details',
    descriptionKk: 'KK details',
    discountText: '-15%',
    status: 'ACTIVE',
    businessId: 'b1',
  };

  it('prefills promotion form', () => {
    expect(promotionEditFormFromRow(promo)).toEqual({
      title: 'Sale',
      titleKk: 'Жеңілдік',
      description: 'Details',
      descriptionKk: 'KK details',
      discountText: '-15%',
    });
  });

  it('update body excludes status (toggle is separate)', () => {
    const body = buildPromotionUpdateBody({
      title: 'Updated',
      titleKk: 'KK',
      description: 'D',
      descriptionKk: '',
      discountText: '-20%',
    });
    expect(body).toEqual({
      title: 'Updated',
      titleKk: 'KK',
      description: 'D',
      descriptionKk: '',
      discountText: '-20%',
    });
    expect(body).not.toHaveProperty('status');
  });

  it('permission gating helper', () => {
    expect(canEditPromotion(true)).toBe(true);
    expect(canEditPromotion(false)).toBe(false);
  });
});
