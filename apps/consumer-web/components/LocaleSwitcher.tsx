'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { swapLocaleInPathname } from '@/lib/locale-path';
import { LOCALE_COOKIE_NAME, type AppLocale, type UiLabels } from '@/lib/locale';
import type { PublicLocale } from '@/lib/public-locale';

function setLocaleCookie(next: AppLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=31536000;SameSite=Lax`;
}

export function LocaleSwitcher({ locale, labels }: { locale: AppLocale; labels: UiLabels }) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const router = useRouter();

  function switchTo(next: PublicLocale) {
    if (next === locale) return;
    setLocaleCookie(next);
    const target = swapLocaleInPathname(pathname, {
      locationId: searchParams.get('locationId'),
      page: searchParams.get('page'),
    }, next);
    router.push(target);
  }

  return (
    <div className="locale-switch" role="group" aria-label={labels.languageSwitcherAria}>
      <button
        type="button"
        className={locale === 'ru' ? 'locale-switch__btn locale-switch__btn--active' : 'locale-switch__btn'}
        aria-pressed={locale === 'ru'}
        onClick={() => switchTo('ru')}
      >
        {labels.localeRu}
      </button>
      <button
        type="button"
        className={locale === 'kk' ? 'locale-switch__btn locale-switch__btn--active' : 'locale-switch__btn'}
        aria-pressed={locale === 'kk'}
        onClick={() => switchTo('kk')}
      >
        {labels.localeKk}
      </button>
    </div>
  );
}
