'use client';

import { UserRole } from '@qalago/shared-types';
import type { AuthUser, CityRow } from '@/lib/api';
import {
  periodToRange,
  type PeriodPreset,
  type ReportQueryParams,
} from '@/lib/reporting/filters';

type ReportFilterBarProps = {
  user: AuthUser;
  params: ReportQueryParams;
  onChange: (next: Partial<ReportQueryParams>) => void;
  validationError: string | null;
  cities?: CityRow[];
  showCity?: boolean;
  showCategory?: boolean;
  showPlacement?: boolean;
  showPlan?: boolean;
};

export function ReportFilterBar({
  user,
  params,
  onChange,
  validationError,
  cities = [],
  showCity = true,
  showCategory = false,
  showPlacement = false,
  showPlan = false,
}: ReportFilterBarProps) {
  const isCityAdmin = user.role === UserRole.CITY_ADMIN;
  const cityOptions = isCityAdmin
    ? cities.filter(
        (c) =>
          c.id === user.managedCityId ||
          user.managedCity?.slug === c.slug,
      )
    : cities;

  const cityLocked = isCityAdmin && cityOptions.length <= 1;

  function applyPreset(preset: PeriodPreset) {
    if (preset === 'custom') return;
    const range = periodToRange(preset);
    onChange({ from: range.from, to: range.to });
  }

  return (
    <div className="report-filter-bar card">
      <div className="report-filter-row">
        <label className="report-filter-field">
          <span>Период</span>
          <select
            defaultValue=""
            onChange={(e) => applyPreset(e.target.value as PeriodPreset)}
          >
            <option value="" disabled>
              Быстрый выбор
            </option>
            <option value="today">Сегодня</option>
            <option value="7d">7 дней</option>
            <option value="30d">30 дней</option>
            <option value="90d">90 дней</option>
          </select>
        </label>
        <label className="report-filter-field">
          <span>С</span>
          <input
            type="date"
            value={params.from?.slice(0, 10) ?? ''}
            onChange={(e) => onChange({ from: e.target.value })}
          />
        </label>
        <label className="report-filter-field">
          <span>По</span>
          <input
            type="date"
            value={params.to?.slice(0, 10) ?? ''}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </label>
        {showCity ? (
          <label className="report-filter-field">
            <span>Город</span>
            <select
              value={params.cityId ?? ''}
              disabled={cityLocked}
              onChange={(e) => onChange({ cityId: e.target.value || undefined })}
            >
              {!isCityAdmin ? <option value="">Все города</option> : null}
              {cityOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameRu}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {showPlacement ? (
          <label className="report-filter-field">
            <span>Размещение</span>
            <input
              value={params.placement ?? ''}
              placeholder="HOME_VIP_BANNER"
              onChange={(e) => onChange({ placement: e.target.value || undefined })}
            />
          </label>
        ) : null}
        {showPlan ? (
          <label className="report-filter-field">
            <span>Тариф</span>
            <select
              value={params.plan ?? ''}
              onChange={(e) => onChange({ plan: e.target.value || undefined })}
            >
              <option value="">Все</option>
              <option value="FREE">FREE</option>
              <option value="BASIC">BASIC</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="VIP">VIP</option>
            </select>
          </label>
        ) : null}
        {showCategory ? (
          <label className="report-filter-field">
            <span>Категория ID</span>
            <input
              value={params.categoryId ?? ''}
              onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
            />
          </label>
        ) : null}
      </div>
      {validationError ? <p className="report-filter-error">{validationError}</p> : null}
    </div>
  );
}
