import { citySearchPath } from '@/lib/routes';
import type { UiLabels } from '@/lib/locale';
import type { PublicLocale } from '@/lib/public-locale';

export function SearchForm({
  locale,
  citySlug,
  labels,
  defaultQuery = '',
}: {
  locale: PublicLocale;
  citySlug: string;
  labels: UiLabels;
  defaultQuery?: string;
}) {
  return (
    <form className="search-form" action={citySearchPath(locale, citySlug)} method="get" role="search">
      <label className="search-form__label" htmlFor="qalago-search-q">
        {labels.searchLabel}
      </label>
      <div className="search-form__row">
        <input
          id="qalago-search-q"
          className="search-form__input"
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder={labels.searchPlaceholder}
          maxLength={100}
          autoComplete="off"
        />
        <button type="submit" className="search-form__submit public-btn public-btn--primary">
          {labels.searchSubmit}
        </button>
      </div>
    </form>
  );
}
