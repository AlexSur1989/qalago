'use client';

import { LOCALE_COOKIE_NAME, type AppLocale, type UiLabels } from '@/lib/locale';

export function LocaleSwitcher({ locale, labels }: { locale: AppLocale; labels: UiLabels }) {
  function setLocale(next: AppLocale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  }

  return (
    <div className="locale-switch" role="group" aria-label={labels.languageSwitcherAria}>
      <button
        type="button"
        className={locale === 'ru' ? 'locale-switch__btn locale-switch__btn--active' : 'locale-switch__btn'}
        aria-pressed={locale === 'ru'}
        onClick={() => setLocale('ru')}
      >
        {labels.localeRu}
      </button>
      <button
        type="button"
        className={locale === 'kk' ? 'locale-switch__btn locale-switch__btn--active' : 'locale-switch__btn'}
        aria-pressed={locale === 'kk'}
        onClick={() => setLocale('kk')}
      >
        {labels.localeKk}
      </button>
    </div>
  );
}
