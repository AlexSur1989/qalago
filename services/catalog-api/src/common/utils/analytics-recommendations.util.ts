import type { AnalyticsCapabilities } from './analytics-capabilities.util';
import type { CategoryBenchmarkResult } from './analytics-benchmark.util';
import {
  periodCtrPercent,
  sumIntentActionsFromDaily,
  viewToIntentConversionPercent,
  type DailyMetricTotals,
} from './analytics-dashboard-metrics.util';
import {
  BENCHMARK_CONVERSION_UNDERPERFORM_RATIO,
  BENCHMARK_CTR_UNDERPERFORM_RATIO,
  BENCHMARK_OUTPERFORM_RATIO,
  BENCHMARK_VISIBILITY_UNDERPERFORM_RATIO,
  MIN_CLASSIFIED_AUDIENCE_VIEWS,
  MIN_IMPRESSIONS_FOR_CTR_INSIGHT,
  MIN_PROMOTION_VIEWS_FOR_INSIGHT,
  MIN_SEARCH_ATTRIBUTED_VIEWS,
  MIN_VIEWS_FOR_CONVERSION_INSIGHT,
  MIN_VIEWS_FOR_VISIBILITY_BENCHMARK,
  RECOMMENDATION_MAX_COUNT,
} from './analytics-insights.constants';

export type AnalyticsRecommendation = {
  id: string;
  title: string;
  body: string;
  severity: 'issue' | 'opportunity' | 'insight';
  metricBasis?: string;
  priority: number;
};

export type RecommendationBuildContext = {
  caps: AnalyticsCapabilities;
  subjectTotals: DailyMetricTotals;
  benchmark: CategoryBenchmarkResult | null;
  promotionViews: number;
  searchAttributedViews: number | null;
  returningShare: number | null;
  classifiedAudienceViews: number;
  peakHourLabel: string | null;
};

type ScoredRec = AnalyticsRecommendation;

function push(
  list: ScoredRec[],
  item: Omit<ScoredRec, 'priority'> & { priority: number },
) {
  list.push(item);
}

export function buildDeterministicRecommendations(
  ctx: RecommendationBuildContext,
): Array<{ id: string; title: string; body: string }> {
  const views = ctx.subjectTotals.views;
  const actions = sumIntentActionsFromDaily(ctx.subjectTotals);
  const conversion = viewToIntentConversionPercent(actions, views);
  const ctr = periodCtrPercent(views, ctx.subjectTotals.impressions);
  const candidates: ScoredRec[] = [];

  const bench =
    ctx.benchmark?.status === 'AVAILABLE' ? ctx.benchmark : null;

  if (bench && views >= MIN_VIEWS_FOR_VISIBILITY_BENCHMARK) {
    if (
      bench.categoryAvgViews > 0 &&
      views < bench.categoryAvgViews * BENCHMARK_VISIBILITY_UNDERPERFORM_RATIO
    ) {
      push(candidates, {
        id: 'visibility-below-category',
        severity: 'issue',
        priority: 10,
        metricBasis: `views:${views},peerAvgViews:${bench.categoryAvgViews}`,
        title: 'Просмотров меньше среднего по категории',
        body: 'По сравнению с похожими заведениями в вашем городе карточку открывают реже. Может помочь актуальное описание, фото и продвижение.',
      });
    } else if (
      bench.businessConversionRate != null &&
      bench.categoryAvgConversionRate != null &&
      bench.businessConversionRate >
        bench.categoryAvgConversionRate * BENCHMARK_OUTPERFORM_RATIO
    ) {
      push(candidates, {
        id: 'conversion-above-category',
        severity: 'insight',
        priority: 80,
        metricBasis: 'conversionRate',
        title: 'Конверсия выше среднего по категории',
        body: 'Доля целевых действий после просмотра карточки выше, чем у похожих заведений в категории.',
      });
    }
  }

  if (
    ctx.caps.ctr &&
    ctr != null &&
    ctx.subjectTotals.impressions >= MIN_IMPRESSIONS_FOR_CTR_INSIGHT &&
    bench?.categoryAvgCtr != null &&
    ctr < bench.categoryAvgCtr * BENCHMARK_CTR_UNDERPERFORM_RATIO
  ) {
    push(candidates, {
      id: 'ctr-below-category',
      severity: 'issue',
      priority: 20,
      metricBasis: `ctr:${ctr},peerCtr:${bench.categoryAvgCtr}`,
      title: 'Низкий CTR карточки',
      body: 'Показы есть, но переходы в карточку ниже среднего по категории. Может помочь обложка, название и краткое описание.',
    });
  }

  if (
    views >= MIN_VIEWS_FOR_CONVERSION_INSIGHT &&
    conversion != null &&
    bench?.categoryAvgConversionRate != null &&
    conversion < bench.categoryAvgConversionRate * BENCHMARK_CONVERSION_UNDERPERFORM_RATIO
  ) {
    push(candidates, {
      id: 'intent-conversion-weak',
      severity: 'issue',
      priority: 25,
      metricBasis: `conversion:${conversion}`,
      title: 'Мало целевых действий после просмотра',
      body: 'Клиенты смотрят карточку, но реже совершают звонки, маршрут или другие целевые действия. Проверьте контакты и понятность призывов.',
    });
  } else if (views >= MIN_VIEWS_FOR_CONVERSION_INSIGHT && actions === 0 && ctx.caps.actions) {
    push(candidates, {
      id: 'no-intent-actions',
      severity: 'issue',
      priority: 30,
      metricBasis: `views:${views},actions:0`,
      title: 'Просмотры без целевых действий',
      body: 'За период не зафиксированы звонки, WhatsApp, маршрут и другие целевые действия. Проверьте актуальность контактов в карточке.',
    });
  }

  if (
    ctx.searchAttributedViews != null &&
    views >= MIN_SEARCH_ATTRIBUTED_VIEWS &&
    ctx.searchAttributedViews < views * 0.15
  ) {
    push(candidates, {
      id: 'search-discovery-low',
      severity: 'opportunity',
      priority: 40,
      metricBasis: 'searchTrafficShare',
      title: 'Мало переходов из поиска',
      body: 'Большая часть просмотров приходит не из поиска. Может помочь точное описание, категория и ключевые слова в карточке.',
    });
  }

  if (
    ctx.caps.promotionAnalytics &&
    ctx.promotionViews < MIN_PROMOTION_VIEWS_FOR_INSIGHT &&
    views >= MIN_VIEWS_FOR_CONVERSION_INSIGHT
  ) {
    push(candidates, {
      id: 'promotions-visibility',
      severity: 'opportunity',
      priority: 50,
      metricBasis: 'promotionViews',
      title: 'Мало просмотров акций',
      body: 'Акции почти не просматривают. Обновите или добавьте акцию — это может повысить интерес к карточке.',
    });
  }

  if (
    ctx.classifiedAudienceViews >= MIN_CLASSIFIED_AUDIENCE_VIEWS &&
    ctx.returningShare != null &&
    ctx.returningShare < 25
  ) {
    push(candidates, {
      id: 'returning-share-low',
      severity: 'opportunity',
      priority: 60,
      metricBasis: 'returningShare',
      title: 'Низкая доля вернувшихся просмотров',
      body: 'Среди классифицированных просмотров мало повторных. Регулярные обновления карточки и акций могут поддерживать интерес.',
    });
  }

  if (ctx.peakHourLabel) {
    push(candidates, {
      id: 'popular-hours',
      severity: 'insight',
      priority: 70,
      metricBasis: 'popularTimes',
      title: 'Пик активности по часам',
      body: `Наибольшая активность наблюдается ${ctx.peakHourLabel}. Можно учитывать это время при публикации акций.`,
    });
  }

  candidates.sort((a, b) => a.priority - b.priority);
  const top = candidates.slice(0, RECOMMENDATION_MAX_COUNT);

  return top.map(({ id, title, body }) => ({ id, title, body }));
}
