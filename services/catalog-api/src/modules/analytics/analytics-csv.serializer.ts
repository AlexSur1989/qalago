import { formatCsvRow } from '../../common/utils/csv.util';

type DashboardExportInput = {
  effectivePlan: string;
  effectiveRange: { days: number; from: string; to: string };
  overview: { views: number; totalCustomerActions?: number };
  actions: {
    total: number;
    calls: number;
    whatsapp: number;
    routes: number;
    website: number;
    instagram: number;
    favorites: number;
    promotionViews: number;
  } | null;
  conversion: { views: number; actions: number; rate: number } | null;
  sources: Array<{ label: string; views: number; share: number }> | null;
  searchQueries: Array<{ query: string; count: number; percentage: number }> | null;
  searchQueriesStatus?: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null;
  searchQueriesOtherCount?: number | null;
  audienceGeography: Array<{ label: string; count: number; percentage: number }> | null;
  audienceGeographyStatus?: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null;
  popularTimes: {
    byHour: Array<{ hour: number; count: number }>;
    byWeekday: Array<{ weekday: number; label: string; count: number }>;
  } | null;
  benchmark:
    | {
        status?: 'AVAILABLE' | 'INSUFFICIENT_DATA';
        categoryTitle?: string;
        businessViews?: number;
        categoryAvgViews?: number;
        businessActions?: number;
        categoryAvgActions?: number;
        message?: string;
      }
    | null;
  recommendations: Array<{ title: string; body: string }> | null;
  trends: {
    views: Array<{ date: string; count: number }>;
    actions?: Array<{ date: string; count: number }>;
  };
  capabilities: {
    trafficSources: boolean;
    searchQueries: boolean;
    audienceGeography: boolean;
    popularTimes: boolean;
    benchmark: boolean;
    recommendations: boolean;
    actions: boolean;
  };
};

export type AnalyticsExportMeta = {
  businessTitle: string;
  cityName: string;
  generatedAt: Date;
};

function formatIsoDate(iso: string): string {
  return iso.slice(0, 10);
}

function formatGeneratedAt(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function row(lines: string[], ...cells: Array<string | number | null | undefined>) {
  lines.push(formatCsvRow(cells));
}

export function buildAnalyticsExportCsv(
  dashboard: DashboardExportInput,
  meta: AnalyticsExportMeta,
): string {
  const lines: string[] = [];

  row(lines, 'QalaGo — Аналитика бизнеса');
  row(lines, '');
  row(lines, 'Бизнес', meta.businessTitle);
  row(lines, 'Город', meta.cityName);
  row(lines, 'Тариф', dashboard.effectivePlan);
  row(
    lines,
    'Период',
    `${formatIsoDate(dashboard.effectiveRange.from)} — ${formatIsoDate(dashboard.effectiveRange.to)} (${dashboard.effectiveRange.days} дн.)`,
  );
  row(lines, 'Сформирован', formatGeneratedAt(meta.generatedAt));
  row(lines, '');

  row(lines, 'СВОДКА');
  row(lines, 'Показатель', 'Значение');
  row(lines, 'Просмотры карточки', dashboard.overview.views);
  if (dashboard.actions) {
    row(lines, 'Действия клиентов', dashboard.actions.total);
    row(lines, 'Звонки', dashboard.actions.calls);
    row(lines, 'WhatsApp', dashboard.actions.whatsapp);
    row(lines, 'Маршруты', dashboard.actions.routes);
    row(lines, 'Переходы на сайт', dashboard.actions.website);
    row(lines, 'Переходы в Instagram', dashboard.actions.instagram);
    row(lines, 'Добавления в избранное', dashboard.actions.favorites);
    row(lines, 'Просмотры акций', dashboard.actions.promotionViews);
  }
  if (dashboard.conversion) {
    row(lines, 'Конверсия', `${dashboard.conversion.rate}%`);
  }

  if (dashboard.capabilities.trafficSources) {
    row(lines, '');
    row(lines, 'ИСТОЧНИКИ ТРАФИКА');
    row(lines, 'Источник', 'Просмотры', 'Доля');
    if (dashboard.sources && dashboard.sources.length > 0) {
      for (const source of dashboard.sources) {
        row(lines, source.label, source.views, `${source.share}%`);
      }
    } else {
      row(lines, 'Статус', 'Недостаточно данных');
    }
  }

  if (dashboard.capabilities.searchQueries) {
    row(lines, '');
    row(lines, 'ПОИСКОВЫЕ ЗАПРОСЫ');
    if (dashboard.searchQueries && dashboard.searchQueries.length > 0) {
      row(lines, 'Запрос', 'Количество', 'Доля');
      for (const item of dashboard.searchQueries) {
        row(lines, item.query, item.count, `${item.percentage}%`);
      }
      if (dashboard.searchQueriesOtherCount != null && dashboard.searchQueriesOtherCount > 0) {
        row(lines, 'Другие запросы', dashboard.searchQueriesOtherCount, '');
      }
    } else {
      row(lines, 'Статус', 'Недостаточно данных');
    }
  }

  if (dashboard.capabilities.audienceGeography) {
    row(lines, '');
    row(lines, 'АУДИТОРИЯ ПО РАССТОЯНИЮ');
    row(
      lines,
      'Примечание',
      'Примерное расстояние в момент открытия карточки. Точные координаты не сохраняются.',
    );
    if (dashboard.audienceGeography && dashboard.audienceGeography.length > 0) {
      row(lines, 'Расстояние', 'Количество', 'Доля');
      for (const item of dashboard.audienceGeography) {
        row(lines, item.label, item.count, `${item.percentage}%`);
      }
    } else {
      row(lines, 'Статус', 'Недостаточно данных');
    }
  }

  if (dashboard.capabilities.popularTimes && dashboard.popularTimes) {
    row(lines, '');
    row(lines, 'ПОПУЛЯРНЫЕ ЧАСЫ');
    row(lines, 'Час', 'Просмотры');
    for (const item of dashboard.popularTimes.byHour) {
      if (item.count > 0) {
        row(lines, `${item.hour}:00`, item.count);
      }
    }
    row(lines, '');
    row(lines, 'ПОПУЛЯРНЫЕ ДНИ');
    row(lines, 'День', 'Просмотры');
    for (const item of dashboard.popularTimes.byWeekday) {
      if (item.count > 0) {
        row(lines, item.label, item.count);
      }
    }
  }

  if (dashboard.capabilities.benchmark && dashboard.benchmark) {
    row(lines, '');
    row(lines, 'СРАВНЕНИЕ С КАТЕГОРИЕЙ');
    if (dashboard.benchmark.status === 'INSUFFICIENT_DATA') {
      row(lines, 'Статус', dashboard.benchmark.message ?? 'Недостаточно данных');
    } else {
      row(lines, 'Категория', dashboard.benchmark.categoryTitle ?? '');
      row(lines, 'Просмотры бизнеса', dashboard.benchmark.businessViews ?? 0);
      row(lines, 'Среднее по категории (просмотры)', dashboard.benchmark.categoryAvgViews ?? 0);
      row(lines, 'Действия бизнеса', dashboard.benchmark.businessActions ?? 0);
      row(lines, 'Среднее по категории (действия)', dashboard.benchmark.categoryAvgActions ?? 0);
    }
  }

  if (dashboard.capabilities.recommendations && dashboard.recommendations?.length) {
    row(lines, '');
    row(lines, 'РЕКОМЕНДАЦИИ');
    row(lines, 'Заголовок', 'Текст');
    for (const item of dashboard.recommendations) {
      row(lines, item.title, item.body);
    }
  }

  if (dashboard.trends.views.length > 0) {
    row(lines, '');
    row(lines, 'ДИНАМИКА ПРОСМОТРОВ');
    row(lines, 'Дата', 'Просмотры');
    for (const point of dashboard.trends.views) {
      row(lines, point.date, point.count);
    }
  }

  if (dashboard.trends.actions && dashboard.trends.actions.length > 0) {
    row(lines, '');
    row(lines, 'ДИНАМИКА ДЕЙСТВИЙ');
    row(lines, 'Дата', 'Действия');
    for (const point of dashboard.trends.actions) {
      row(lines, point.date, point.count);
    }
  }

  return lines.join('\r\n');
}

export const CSV_UTF8_BOM = '\ufeff';
