import { describe, expect, it } from 'vitest';
import { presentBusinessNotification } from '@/lib/notification-presentation';

describe('presentBusinessNotification', () => {
  const typed = {
    type: 'NEW_REVIEW',
    title: 'Legacy RU title',
    body: 'Legacy RU body',
    payload: { businessId: 'b1', reviewId: 'r1', rating: 5 },
  };

  it('typed KK / RU presentation', () => {
    const kk = presentBusinessNotification(typed, 'kk');
    const ru = presentBusinessNotification(typed, 'ru');
    expect(kk.usedLegacyFallback).toBe(false);
    expect(kk.title).toBe('Жаңа пікір');
    expect(ru.title).toBe('Новый отзыв');
    expect(kk.body).not.toBe(ru.body);
  });

  it('GENERAL uses legacy strings', () => {
    const out = presentBusinessNotification(
      { ...typed, type: 'GENERAL', title: 'T', body: 'B' },
      'kk',
    );
    expect(out).toMatchObject({ title: 'T', body: 'B', usedLegacyFallback: true });
  });

  it('sparse typed payload → generic localized copy', () => {
    const out = presentBusinessNotification(
      { ...typed, payload: { businessId: 'b1' } },
      'kk',
    );
    expect(out.body).toBe('Компанияңыз туралы жаңа пікір қалдырылды.');
    expect(out.body).not.toContain('Legacy');
  });

  it('does not machine-translate legacy free text for typed rows', () => {
    const out = presentBusinessNotification(
      {
        type: 'REVIEW_REPLY',
        title: 'Ответ',
        body: 'Авторский текст ответа',
        payload: { businessId: 'b1', reviewId: 'r1' },
      },
      'ru',
    );
    expect(out.body).not.toContain('Авторский текст');
    expect(out.body).toContain('ответила');
  });
});
