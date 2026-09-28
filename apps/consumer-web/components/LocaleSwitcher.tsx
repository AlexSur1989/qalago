'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  buildLocaleSwitchTarget,
  resolveEffectivePublicLocale,
} from '@/lib/locale-path';
import { LOCALE_COOKIE_NAME, UI_LABELS, type AppLocale } from '@/lib/locale';
import type { PublicLocale } from '@/lib/public-locale';

function setLocaleCookie(next: AppLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=31536000;SameSite=Lax`;
}

export function LocaleSwitcher({ locale: layoutLocale }: { locale: AppLocale }) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeLocale = resolveEffectivePublicLocale(pathname, layoutLocale);
  const labels = UI_LABELS[activeLocale];

  function switchTo(next: PublicLocale) {
    if (next === activeLocale) return;
    setLocaleCookie(next);
    const target = buildLocaleSwitchTarget(pathname, searchParams, next);
    const targetPath = target.split('?')[0] ?? target;
    if (targetPath === pathname) {
      router.refresh();
      return;
    }
    router.push(target);
  }

  return (
    <div className="locale-switch" role="group" aria-label={labels.languageSwitcherAria}>
      <button
        type="button"
        className={activeLocale === 'ru' ? 'locale-switch__btn locale-switch__btn--active' : 'locale-switch__btn'}
        aria-pressed={activeLocale === 'ru'}
        onClick={() => switchTo('ru')}
      >
        {labels.localeRu}
      </button>
      <button
        type="button"
        className={activeLocale === 'kk' ? 'locale-switch__btn locale-switch__btn--active' : 'locale-switch__btn'}
        aria-pressed={activeLocale === 'kk'}
        onClick={() => switchTo('kk')}
      >
        {labels.localeKk}
      </button>
    </div>
  );
}
