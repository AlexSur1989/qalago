'use client';

import type { AppLocale } from '@/lib/locale';

export function LocaleSwitcher({ locale }: { locale: AppLocale }) {
  function setLocale(next: AppLocale) {
    document.cookie = `qalago_locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  }

  return (
    <div className="locale-switch" role="group" aria-label="Язык интерфейса">
      <button
        type="button"
        className={locale === 'ru' ? 'locale-switch__btn locale-switch__btn--active' : 'locale-switch__btn'}
        onClick={() => setLocale('ru')}
      >
        RU
      </button>
      <button
        type="button"
        className={locale === 'kk' ? 'locale-switch__btn locale-switch__btn--active' : 'locale-switch__btn'}
        onClick={() => setLocale('kk')}
      >
        KZ
      </button>
    </div>
  );
}
