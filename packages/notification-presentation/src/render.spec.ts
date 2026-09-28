import { describe, expect, it } from 'vitest';
import { resolvePresentationLocale } from './locale';
import { renderNotificationPresentation } from './render';

describe('resolvePresentationLocale', () => {
  it('maps kk, ru, null, invalid', () => {
    expect(resolvePresentationLocale('kk')).toBe('kk');
    expect(resolvePresentationLocale('kk-KZ')).toBe('kk');
    expect(resolvePresentationLocale('ru')).toBe('ru');
    expect(resolvePresentationLocale(null)).toBe('kk');
    expect(resolvePresentationLocale(undefined)).toBe('kk');
    expect(resolvePresentationLocale('en')).toBe('kk');
  });
});

describe('renderNotificationPresentation', () => {
  const sparseNewReview = {
    type: 'NEW_REVIEW',
    payload: { businessId: 'b1', reviewId: 'r1', rating: 5 },
    legacyTitle: 'Legacy title',
    legacyBody: 'Legacy body',
  };

  it('typed NEW_REVIEW kk / ru / null / invalid locale', () => {
    for (const locale of ['kk', 'ru'] as const) {
      const out = renderNotificationPresentation({ ...sparseNewReview, locale });
      expect(out.usedLegacyFallback).toBe(false);
      expect(out.title.length).toBeGreaterThan(0);
      expect(out.body).toBeTruthy();
    }
    const kkNull = renderNotificationPresentation({
      ...sparseNewReview,
      locale: resolvePresentationLocale(null),
    });
    expect(kkNull.title).toBe('Жаңа пікір');
    const kkInvalid = renderNotificationPresentation({
      ...sparseNewReview,
      locale: resolvePresentationLocale('xx'),
    });
    expect(kkInvalid.title).toBe('Жаңа пікір');
  });

  it('GENERAL uses legacy title/body', () => {
    const out = renderNotificationPresentation({
      type: 'GENERAL',
      locale: 'ru',
      payload: null,
      legacyTitle: ' T ',
      legacyBody: ' B ',
    });
    expect(out).toEqual({
      title: 'T',
      body: 'B',
      usedLegacyFallback: true,
    });
  });

  it('sparse payload uses generic localized copy', () => {
    const kk = renderNotificationPresentation({
      type: 'NEW_REVIEW',
      locale: 'kk',
      payload: { businessId: 'b1' },
      legacyTitle: 'Новый отзыв',
      legacyBody: 'named legacy',
    });
    expect(kk.body).toBe('Компанияңыз туралы жаңа пікір қалдырылды.');
    expect(kk.body).not.toContain('named legacy');
  });

  it('does not throw on malformed payload', () => {
    expect(() =>
      renderNotificationPresentation({
        type: 'PLAN_ACTIVATED',
        locale: 'ru',
        payload: 'not-an-object' as unknown as Record<string, unknown>,
        legacyTitle: 'x',
        legacyBody: 'y',
      }),
    ).not.toThrow();
  });

  it('REVIEW_REPLY push does not leak owner reply from legacy body', () => {
    const out = renderNotificationPresentation({
      type: 'REVIEW_REPLY',
      locale: 'ru',
      payload: { businessId: 'b1', reviewId: 'r1' },
      legacyTitle: 'Ответ',
      legacyBody: 'Секретный полный текст ответа владельца',
      forPush: true,
    });
    expect(out.body).not.toContain('Секретный');
    expect(out.body).toContain('ответила');
  });

  it('rejection push uses generic body without safe publicReason', () => {
    const out = renderNotificationPresentation({
      type: 'BUSINESS_APPLICATION_REJECTED',
      locale: 'ru',
      payload: { applicationId: 'a1' },
      legacyTitle: 'Заявка',
      legacyBody: 'Причина в legacy',
      forPush: true,
    });
    expect(out.body).not.toContain('Причина в legacy');
    expect(out.body).toBe('Ваша заявка на добавление компании отклонена.');
  });

  it('rejection in-app may include bounded publicReason', () => {
    const out = renderNotificationPresentation({
      type: 'OWNERSHIP_CLAIM_REJECTED',
      locale: 'kk',
      payload: { claimId: 'c1', publicReason: 'Қысқа себеп' },
      legacyTitle: 'x',
      legacyBody: 'y',
      forPush: false,
    });
    expect(out.body).toContain('Қысқа себеп');
  });

  it('internal payload keys are not interpolated into push copy', () => {
    const out = renderNotificationPresentation({
      type: 'NEW_REVIEW',
      locale: 'ru',
      payload: {
        businessId: 'b1',
        staffNote: 'internal only',
        acceptedByUserId: 'u-secret',
      },
      legacyTitle: 't',
      legacyBody: 'b',
      forPush: true,
    });
    expect(JSON.stringify(out)).not.toContain('internal');
    expect(JSON.stringify(out)).not.toContain('u-secret');
  });
});
