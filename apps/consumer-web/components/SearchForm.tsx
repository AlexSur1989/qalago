import { citySearchPath } from '@/lib/routes';
import type { UiLabels } from '@/lib/locale';

export function SearchForm({
  citySlug,
  labels,
  defaultQuery = '',
}: {
  citySlug: string;
  labels: UiLabels;
  defaultQuery?: string;
}) {
  return (
    <form className="search-form" action={citySearchPath(citySlug)} method="get" role="search">
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
        <button type="submit" className="search-form__submit">
          {labels.searchSubmit}
        </button>
      </div>
    </form>
  );
}
