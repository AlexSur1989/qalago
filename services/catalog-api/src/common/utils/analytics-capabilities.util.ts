import { BusinessPlanTier } from '@prisma/client';
import { PLAN_CATALOG } from '../services/plan-limits.service';
import { publicPlanLabelRu } from './plan-display.util';

export interface AnalyticsCapabilities {
  maxDays: number;
  views: boolean;
  viewTrend: boolean;
  actions: boolean;
  actionTrend: boolean;
  trafficSources: boolean;
  conversion: boolean;
  periodComparison: boolean;
  promotionAnalytics: boolean;
  popularTimes: boolean;
  benchmark: boolean;
  recommendations: boolean;
  searchQueries: boolean;
  audienceGeography: boolean;
  reportExport: boolean;
  /** @deprecated use viewTrend / actionTrend */
  summary: boolean;
  /** @deprecated use viewTrend / actionTrend */
  trends: boolean;
  /** @deprecated legacy analytics tier label */
  tier: 'BASIC' | 'EXTENDED' | 'FULL' | 'ANALYTICS_360';
}

export interface AnalyticsLockedSection {
  id: string;
  label: string;
  requiredPlan: BusinessPlanTier;
  message: string;
}

const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function catalogLimits(tier: BusinessPlanTier) {
  return PLAN_CATALOG.find((p) => p.tier === tier)!.limits;
}

export function getAnalyticsCapabilitiesForPlan(tier: BusinessPlanTier): AnalyticsCapabilities {
  const limits = catalogLimits(tier);
  const maxDays = limits.maxAnalyticsDays;

  const isFree = tier === BusinessPlanTier.FREE;
  const isBasicOrAbove = !isFree;
  const isPremiumOrAbove =
    tier === BusinessPlanTier.PREMIUM || tier === BusinessPlanTier.VIP;
  const isVip = tier === BusinessPlanTier.VIP;

  const legacyTier: AnalyticsCapabilities['tier'] = limits.analyticsTier;

  return {
    maxDays,
    views: true,
    viewTrend: true,
    actions: isBasicOrAbove,
    actionTrend: isBasicOrAbove,
    trafficSources: isPremiumOrAbove,
    conversion: isPremiumOrAbove,
    periodComparison: isPremiumOrAbove,
    promotionAnalytics: isPremiumOrAbove,
    popularTimes: isVip,
    benchmark: isVip,
    recommendations: isVip,
    searchQueries: isPremiumOrAbove,
    audienceGeography: isVip,
    reportExport: isVip,
    summary: true,
    trends: isBasicOrAbove,
    tier: legacyTier,
  };
}

export function getAnalyticsHeadline(tier: BusinessPlanTier): string {
  switch (tier) {
    case BusinessPlanTier.FREE:
      return 'Сколько меня смотрят?';
    case BusinessPlanTier.BASIC:
      return 'Что делают после просмотра?';
    case BusinessPlanTier.PREMIUM:
      return 'Откуда приходят посетители и что работает?';
    case BusinessPlanTier.VIP:
      return 'Почему это происходит и что можно улучшить?';
    default:
      return 'Статистика бизнеса';
  }
}

export function getAnalyticsLockedSections(
  tier: BusinessPlanTier,
): AnalyticsLockedSection[] {
  const locked: AnalyticsLockedSection[] = [];

  const businessLabel = publicPlanLabelRu(BusinessPlanTier.BASIC);
  const proLabel = publicPlanLabelRu(BusinessPlanTier.PREMIUM);
  const vipLabel = publicPlanLabelRu(BusinessPlanTier.VIP);

  if (tier === BusinessPlanTier.FREE) {
    locked.push({
      id: 'actions',
      label: 'Действия посетителей',
      requiredPlan: BusinessPlanTier.BASIC,
      message: `Доступно с «${businessLabel}»`,
    });
  }

  if (tier === BusinessPlanTier.FREE || tier === BusinessPlanTier.BASIC) {
    locked.push(
      {
        id: 'sources',
        label: 'Источники',
        requiredPlan: BusinessPlanTier.PREMIUM,
        message: `Доступно с «${proLabel}»`,
      },
      {
        id: 'conversion',
        label: 'Конверсия',
        requiredPlan: BusinessPlanTier.PREMIUM,
        message: `Доступно с «${proLabel}»`,
      },
      {
        id: 'comparison',
        label: 'Сравнение периодов',
        requiredPlan: BusinessPlanTier.PREMIUM,
        message: `Доступно с «${proLabel}»`,
      },
      {
        id: 'searchQueries',
        label: 'Поисковые запросы',
        requiredPlan: BusinessPlanTier.PREMIUM,
        message: `Поисковые запросы доступны с «${proLabel}»`,
      },
    );
  }

  if (tier !== BusinessPlanTier.VIP) {
    locked.push(
      {
        id: 'popularTimes',
        label: 'Популярные часы',
        requiredPlan: BusinessPlanTier.VIP,
        message: `Доступно с «${vipLabel}»`,
      },
      {
        id: 'benchmark',
        label: 'Сравнение с категорией',
        requiredPlan: BusinessPlanTier.VIP,
        message: `Доступно с «${vipLabel}»`,
      },
      {
        id: 'recommendations',
        label: 'Рекомендации',
        requiredPlan: BusinessPlanTier.VIP,
        message: `Доступно с «${vipLabel}»`,
      },
      {
        id: 'audienceGeography',
        label: 'Аудитория по расстоянию',
        requiredPlan: BusinessPlanTier.VIP,
        message: `Аналитика аудитории доступна на тарифе «${vipLabel}»`,
      },
      {
        id: 'reportExport',
        label: 'Экспорт отчётов',
        requiredPlan: BusinessPlanTier.VIP,
        message: `Экспорт отчётов доступен на тарифе «${vipLabel}»`,
      },
    );
  }

  return locked;
}

export function weekdayLabel(dayIndex: number): string {
  return WEEKDAY_LABELS[dayIndex] ?? `${dayIndex}`;
}

export function buildDateRange(days: number, end = new Date()): string[] {
  const result: string[] = [];
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDay);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export function windowStart(days: number, end = new Date()): Date {
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function deltaPercent(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}
