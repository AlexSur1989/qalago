import { formatCsvRow } from '../../common/utils/csv.util';
import type { BusinessAnalyticsReport } from './analytics-business-report.types';

type DashboardSlice = {
  effectivePlan: string;
  effectiveRange: { days: number; from: string; to: string };
  overview: Record<string, unknown>;
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
  searchQueriesOtherCount?: number | null;
  audienceGeography: Array<{ label: string; count: number; percentage: number }> | null;
  audienceGeographyStatus?: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null;
  audience: {
    newVisitorViews?: number;
    returningVisitorViews?: number;
    newShare?: number | null;
    returningShare?: number | null;
    totalClassified?: number;
  } | null;
  popularTimes: {
    byHour: Array<{ hour: number; count: number }>;
  } | null;
  benchmark: Record<string, unknown> | null;
  recommendations: Array<{ id?: string; title: string; body: string }> | null;
  comparison: {
    metrics: Array<{
      key: string;
      label: string;
      current: number;
      previous: number;
      deltaPercent: number | null;
    }>;
  } | null;
  promotions: {
    promotionViews?: number;
    byPromotion?: Array<{ promotionId: string; views: number; actions: null }>;
    actionsAvailable?: boolean;
  } | null;
  catalog: {
    items?: Array<{ catalogItemId: string; views: number; actions: null }>;
    actionsAvailable?: boolean;
  } | null;
  trends: {
    views: Array<{ date: string; count: number }>;
    actions?: Array<{ date: string; count: number }>;
  };
  capabilities: Record<string, boolean>;
};

function formatGeneratedAt(iso: string): string {
  return iso.replace('T', ' ').slice(0, 19);
}

function row(lines: string[], ...cells: Array<string | number | null | undefined>) {
  lines.push(formatCsvRow(cells));
}

function dashboardFromReport(report: BusinessAnalyticsReport): DashboardSlice {
  return report.dashboard as unknown as DashboardSlice;
}

export function buildAnalyticsExportCsv(report: BusinessAnalyticsReport): string {
  const dashboard = dashboardFromReport(report);
  const lines: string[] = [];

  row(lines, 'QalaGo Analytics Report');
  row(lines, 'SchemaVersion', report.schemaVersion);
  row(lines, '');
  row(lines, 'Бизнес', report.business.name);
  row(lines, 'BusinessId', report.business.id);
  row(lines, 'Город', report.business.cityName);
  if (report.business.categoryTitle) {
    row(lines, 'Категория', report.business.categoryTitle);
  }
  row(lines, 'Тариф', dashboard.effectivePlan);
  row(lines, 'Тип периода', report.period.type);
  row(lines, 'Timezone', report.period.timezone);
  row(
    lines,
    'Период',
    `${report.period.startDate} — ${report.period.endDate} (${report.period.days} дн.)`,
  );
  if (report.previousPeriod) {
    row(
      lines,
      'Предыдущий период',
      `${report.previousPeriod.startDate} — ${report.previousPeriod.endDate}`,
    );
  }
  row(lines, 'Сформирован', formatGeneratedAt(report.period.generatedAt));
  row(lines, '');

  if (report.summary.length > 0) {
    row(lines, 'КРАТКОЕ РЕЗЮМЕ');
    for (const sentence of report.summary) {
      row(lines, sentence);
    }
    row(lines, '');
  }

  row(lines, 'OVERVIEW');
  row(lines, 'Metric', 'Value');
  row(lines, 'Просмотры карточки', dashboard.overview.views as number);
  if (dashboard.overview.impressions != null && dashboard.capabilities.impressions) {
    row(lines, 'Показы карточки', dashboard.overview.impressions as number);
  }
  if (dashboard.actions) {
    row(lines, 'Целевые действия (intent)', dashboard.actions.total);
    row(lines, 'Звонки', dashboard.actions.calls);
    row(lines, 'WhatsApp', dashboard.actions.whatsapp);
    row(lines, 'Маршруты', dashboard.actions.routes);
    row(lines, 'Переходы на сайт', dashboard.actions.website);
    row(lines, 'Переходы в Instagram', dashboard.actions.instagram);
    row(lines, 'Добавления в избранное', dashboard.actions.favorites);
  }
  if (dashboard.overview.ctr != null && dashboard.capabilities.ctr) {
    row(lines, 'CTR', `${dashboard.overview.ctr}%`);
  }
  if (dashboard.conversion) {
    row(lines, 'Конверсия просмотр → целевое действие', `${dashboard.conversion.rate}%`);
  }
  if (
    dashboard.overview.uniqueVisitorsDailySumApprox != null &&
    dashboard.capabilities.visitorMetrics
  ) {
    row(
      lines,
      'Уникальные посетители (approx, сумма по дням)',
      dashboard.overview.uniqueVisitorsDailySumApprox as number,
    );
    row(
      lines,
      'Сессии (approx, сумма по дням)',
      dashboard.overview.sessionsDailySumApprox as number,
    );
  }

  if (dashboard.capabilities.conversion && dashboard.overview.impressions != null) {
    row(lines, '');
    row(lines, 'AGGREGATE FUNNEL');
    row(lines, 'Этап', 'Значение');
    row(lines, 'Показы', dashboard.overview.impressions as number);
    row(lines, 'Просмотры', dashboard.overview.views as number);
    row(lines, 'Целевые действия', dashboard.actions?.total ?? 0);
    row(
      lines,
      'Примечание',
      'Агрегированная воронка по периоду, не индивидуальный путь пользователя.',
    );
  }

  if (dashboard.comparison?.metrics.length) {
    row(lines, '');
    row(lines, 'СРАВНЕНИЕ С ПРЕДЫДУЩИМ ПЕРИОДОМ');
    row(lines, 'Метрика', 'Текущий', 'Предыдущий', 'Изменение %');
    for (const m of dashboard.comparison.metrics) {
      row(
        lines,
        m.label,
        m.current,
        m.previous,
        m.deltaPercent != null ? `${m.deltaPercent}%` : '',
      );
    }
  }

  if (dashboard.capabilities.trafficSources) {
    row(lines, '');
    row(lines, 'SOURCES');
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
    row(lines, 'SEARCH');
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

  if (dashboard.capabilities.audience && dashboard.audience) {
    row(lines, '');
    row(lines, 'AUDIENCE (классификация просмотров)');
    row(lines, 'Метрика', 'Значение');
    row(lines, 'Просмотры новых посетителей', dashboard.audience.newVisitorViews ?? 0);
    row(lines, 'Просмотры вернувшихся посетителей', dashboard.audience.returningVisitorViews ?? 0);
    if (dashboard.audience.returningShare != null) {
      row(lines, 'Доля вернувшихся просмотров', `${dashboard.audience.returningShare}%`);
    }
  }

  if (dashboard.capabilities.audienceGeography) {
    row(lines, '');
    row(lines, 'GEOGRAPHY');
    row(
      lines,
      'Примечание',
      'Агрегированные buckets расстояния. Точные координаты не экспортируются.',
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

  if (dashboard.capabilities.promotionAnalytics && dashboard.promotions) {
    row(lines, '');
    row(lines, 'PROMOTIONS');
    row(lines, 'Просмотры акций (сводка)', dashboard.promotions.promotionViews ?? 0);
    if (dashboard.promotions.byPromotion?.length) {
      row(lines, 'PromotionId', 'Просмотры');
      for (const p of dashboard.promotions.byPromotion) {
        row(lines, p.promotionId, p.views);
      }
    }
    if (dashboard.promotions.actionsAvailable === false) {
      row(lines, 'Действия по акциям', 'недоступны');
    }
  }

  if (dashboard.capabilities.catalogAnalytics && dashboard.catalog?.items?.length) {
    row(lines, '');
    row(lines, 'CATALOG');
    row(lines, 'CatalogItemId', 'Просмотры');
    for (const item of dashboard.catalog.items) {
      row(lines, item.catalogItemId, item.views);
    }
    if (dashboard.catalog.actionsAvailable === false) {
      row(lines, 'Действия по товарам', 'недоступны');
    }
  }

  if (dashboard.capabilities.popularTimes && dashboard.popularTimes) {
    row(lines, '');
    row(lines, 'POPULAR TIMES (локальный час города)');
    row(lines, 'Час', 'Просмотры');
    for (const item of dashboard.popularTimes.byHour) {
      if (item.count > 0) {
        row(lines, `${item.hour}:00`, item.count);
      }
    }
  }

  if (dashboard.capabilities.benchmark && dashboard.benchmark) {
    row(lines, '');
    row(lines, 'BENCHMARK');
    const b = dashboard.benchmark as {
      status?: string;
      message?: string;
      categoryTitle?: string;
      cohortSize?: number;
      businessViews?: number;
      categoryAvgViews?: number;
      viewsDeltaPercent?: number | null;
      businessActions?: number;
      categoryAvgActions?: number;
      conversionDeltaPercent?: number | null;
      ctrDeltaPercent?: number | null;
    };
    if (b.status === 'INSUFFICIENT_DATA') {
      row(lines, 'Статус', b.message ?? 'Недостаточно данных');
    } else {
      row(lines, 'Категория', b.categoryTitle ?? '');
      row(lines, 'CohortSize', b.cohortSize ?? '');
      row(lines, 'Просмотры бизнеса', b.businessViews ?? '');
      row(lines, 'Среднее по категории (просмотры)', b.categoryAvgViews ?? '');
      if (b.viewsDeltaPercent != null) row(lines, 'Δ просмотры %', b.viewsDeltaPercent);
      row(lines, 'Целевые действия бизнеса', b.businessActions ?? '');
      row(lines, 'Среднее по категории (действия)', b.categoryAvgActions ?? '');
      if (b.conversionDeltaPercent != null) {
        row(lines, 'Δ конверсия %', b.conversionDeltaPercent);
      }
      if (b.ctrDeltaPercent != null) {
        row(lines, 'Δ CTR %', b.ctrDeltaPercent);
      }
    }
  }

  if (dashboard.capabilities.recommendations && dashboard.recommendations?.length) {
    row(lines, '');
    row(lines, 'RECOMMENDATIONS');
    row(lines, 'Id', 'Заголовок', 'Текст');
    for (const item of dashboard.recommendations) {
      row(lines, item.id ?? '', item.title, item.body);
    }
  }

  if (dashboard.trends.views.length > 0) {
    row(lines, '');
    row(lines, 'TREND VIEWS');
    row(lines, 'Date', 'Views');
    for (const point of dashboard.trends.views) {
      row(lines, point.date, point.count);
    }
  }

  if (dashboard.trends.actions && dashboard.trends.actions.length > 0) {
    row(lines, '');
    row(lines, 'TREND INTENT ACTIONS');
    row(lines, 'Date', 'Actions');
    for (const point of dashboard.trends.actions) {
      row(lines, point.date, point.count);
    }
  }

  return lines.join('\r\n');
}

export const CSV_UTF8_BOM = '\ufeff';
