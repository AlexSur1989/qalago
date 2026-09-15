import type { AppLocale } from './locale';

/** Mirrors BusinessPermission enum values (no import — avoids cycles). */
export type PermissionCode =
  | 'BUSINESS_PROFILE_EDIT'
  | 'BUSINESS_HOURS_EDIT'
  | 'CATALOG_EDIT'
  | 'PHOTOS_EDIT'
  | 'PROMOTIONS_EDIT'
  | 'REVIEWS_REPLY'
  | 'ANALYTICS_VIEW'
  | 'ANALYTICS_EXPORT'
  | 'ADS_MANAGE'
  | 'PAYMENTS_VIEW';

type L = Record<AppLocale, string>;

function pick(locale: AppLocale, table: L): string {
  return table[locale];
}

const PLAN_TIER: Record<string, L> = {
  FREE: { ru: 'Бесплатный', kk: 'Тегін' },
  BASIC: { ru: 'Бизнес', kk: 'Бизнес' },
  PREMIUM: { ru: 'PRO', kk: 'PRO' },
  VIP: { ru: 'VIP', kk: 'VIP' },
};

export function planTierLabel(locale: AppLocale, tier?: string | null): string {
  if (!tier) return pick(locale, PLAN_TIER.FREE);
  return pick(locale, PLAN_TIER[tier] ?? { ru: tier, kk: tier });
}

const BUSINESS_STATUS: Record<string, L> = {
  ACTIVE: { ru: 'Активен', kk: 'Белсенді' },
  PENDING: { ru: 'На модерации', kk: 'Модерацияда' },
  BLOCKED: { ru: 'Заблокирован', kk: 'Блокталған' },
};

export function businessStatusLabel(locale: AppLocale, status: string): string {
  return pick(locale, BUSINESS_STATUS[status] ?? { ru: status, kk: status });
}

const PURCHASE_STATE: Record<string, L> = {
  AVAILABLE: { ru: 'Доступно', kk: 'Қолжетімді' },
  ACTIVE: { ru: 'Активно', kk: 'Белсенді' },
  SCHEDULED: { ru: 'Запланировано', kk: 'Жоспарланған' },
  PENDING_PAYMENT: { ru: 'Ожидает оплаты', kk: 'Төлемді күтуде' },
  PENDING_APPROVAL: { ru: 'На модерации', kk: 'Модерацияда' },
  SOLD_OUT: { ru: 'Мест нет', kk: 'Орын жоқ' },
};

export function purchaseStateLabel(locale: AppLocale, state?: string | null): string {
  if (!state) return '—';
  return pick(locale, PURCHASE_STATE[state] ?? { ru: state, kk: state });
}

const PURCHASE_ACTION: Record<string, L> = {
  BUY: { ru: 'Купить', kk: 'Сатып алу' },
  CONTINUE_PAYMENT: { ru: 'Продолжить оплату', kk: 'Төлемді жалғастыру' },
  RENEW: { ru: 'Продлить', kk: 'Ұзарту' },
};

export function purchaseActionLabel(locale: AppLocale, action?: string | null): string {
  if (!action) return '';
  return pick(locale, PURCHASE_ACTION[action] ?? { ru: action, kk: action });
}

const PRODUCT_CODE: Record<string, L> = {
  BOOST: { ru: 'Поднять карточку', kk: 'Картаны көтеру' },
  TOP_CATEGORY: { ru: 'TOP категории', kk: 'TOP санаттары' },
  PROMOTED_PROMOTION: { ru: 'Продвинуть акцию', kk: 'Акцияны насихаттау' },
  FEATURED_BUSINESS: { ru: 'Популярное место', kk: 'Танымал орын' },
  VIP_BANNER: { ru: 'VIP-баннер', kk: 'VIP-banner' },
  PACKAGE: { ru: 'Пакет', kk: 'Пакет' },
};

export function productLabel(locale: AppLocale, code?: string | null): string {
  if (!code) return '—';
  return pick(locale, PRODUCT_CODE[code] ?? { ru: code, kk: code });
}

const PLACEMENT_CODE: Record<string, L> = {
  HOME_VIP_BANNER: { ru: 'VIP-баннер на главной', kk: 'Басты бетте VIP-banner' },
  HOME_FEATURED: { ru: 'Популярные места', kk: 'Танымал орындар' },
  HOME_PROMOTIONS: { ru: 'Продвигаемые акции', kk: 'Насихатталған акциялар' },
  CATEGORY_TOP: { ru: 'TOP категории', kk: 'TOP санаттары' },
  CATEGORY_BOOST: { ru: 'Поднятые карточки', kk: 'Көтерілген карточкалар' },
  SEARCH_TOP: { ru: 'Поиск (топ)', kk: 'Іздеу (топ)' },
  MAP_FEATURED: { ru: 'Карта (избранное)', kk: 'Карта (таңдаулылар)' },
};

export function placementLabel(
  locale: AppLocale,
  code?: string | null,
  name?: string | null,
): string {
  if (name) return name;
  if (!code) return '—';
  return pick(locale, PLACEMENT_CODE[code] ?? { ru: code, kk: code });
}

const ORDER_STATUS: Record<string, L> = {
  AWAITING_PAYMENT: { ru: 'Ожидает оплаты', kk: 'Төлемді күтуде' },
  PAID: { ru: 'Оплачен', kk: 'Төленген' },
  CANCELLED: { ru: 'Отменён', kk: 'Болдырылмаған' },
  REFUNDED: { ru: 'Возврат', kk: 'Қайтару' },
  PARTIALLY_REFUNDED: { ru: 'Частичный возврат', kk: 'Ішінара қайтару' },
  DRAFT: { ru: 'Черновик', kk: 'Жоба' },
};

export function orderStatusLabel(locale: AppLocale, status: string): string {
  return pick(locale, ORDER_STATUS[status] ?? { ru: status, kk: status });
}

const PAYMENT_STATUS: Record<string, L> = {
  PENDING: { ru: 'Ожидает', kk: 'Күтуде' },
  PAID: { ru: 'Оплачен', kk: 'Төленген' },
  FAILED: { ru: 'Ошибка', kk: 'Қате' },
  CANCELLED: { ru: 'Отменён', kk: 'Болдырылмаған' },
  REFUNDED: { ru: 'Возврат', kk: 'Қайтару' },
  PARTIALLY_REFUNDED: { ru: 'Частичный возврат', kk: 'Ішінара қайтару' },
};

export function paymentStatusLabel(locale: AppLocale, status: string): string {
  return pick(locale, PAYMENT_STATUS[status] ?? { ru: status, kk: status });
}

const CAMPAIGN_STATUS: Record<string, L> = {
  PENDING_MODERATION: { ru: 'На модерации', kk: 'Модерацияда' },
  AWAITING_PAYMENT: { ru: 'Ожидает оплаты', kk: 'Төлемді күтуде' },
  SCHEDULED: { ru: 'Запланирована', kk: 'Жоспарланған' },
  ACTIVE: { ru: 'Активна', kk: 'Белсенді' },
  PAUSED: { ru: 'Приостановлена', kk: 'Уақытша тоқтатылған' },
  COMPLETED: { ru: 'Завершена', kk: 'Аяқталған' },
  CANCELLED: { ru: 'Отменена', kk: 'Болдырылмаған' },
  REJECTED: { ru: 'Отклонена', kk: 'Қабылданбаған' },
};

export function campaignStatusLabel(locale: AppLocale, status: string): string {
  return pick(locale, CAMPAIGN_STATUS[status] ?? { ru: status, kk: status });
}

const CREATIVE_STATUS: Record<string, L> = {
  DRAFT: { ru: 'Черновик', kk: 'Жоба' },
  PENDING: { ru: 'На модерации', kk: 'Модерацияда' },
  APPROVED: { ru: 'Одобрено', kk: 'Бекітілген' },
  REJECTED: { ru: 'Отклонено', kk: 'Қабылданбаған' },
};

export function creativeStatusLabel(locale: AppLocale, status: string): string {
  return pick(locale, CREATIVE_STATUS[status] ?? { ru: status, kk: status });
}

export function vipCampaignDisplayStatus(
  locale: AppLocale,
  campaign: {
    status: string;
    effectiveStatus?: string | null;
    product?: { code?: string | null } | null;
    creative?: { moderationStatus?: string } | null;
  },
): string {
  if (campaign.product?.code !== 'VIP_BANNER') {
    return campaignStatusLabel(locale, campaign.effectiveStatus ?? campaign.status);
  }
  const creativeStatus = campaign.creative?.moderationStatus;
  if (creativeStatus === 'DRAFT' || creativeStatus === 'REJECTED') {
    return pick(locale, {
      ru: 'Ожидает отправки креатива',
      kk: 'Креатив жіберілуді күтуде',
    });
  }
  if (creativeStatus === 'PENDING' || campaign.status === 'PENDING_MODERATION') {
    return pick(locale, { ru: 'На модерации', kk: 'Модерацияда' });
  }
  return campaignStatusLabel(locale, campaign.effectiveStatus ?? campaign.status);
}

export function vipModerationNotice(
  locale: AppLocale,
  campaign: {
    status: string;
    creative?: { moderationStatus?: string } | null;
  },
): string | null {
  const creativeStatus = campaign.creative?.moderationStatus;
  if (creativeStatus === 'DRAFT' || creativeStatus === 'REJECTED') {
    return pick(locale, {
      ru: 'Отправьте креатив на модерацию, чтобы начать проверку VIP-баннера.',
      kk: 'VIP-banner тексеруін бастау үшін креативті модерацияға жіберіңіз.',
    });
  }
  if (creativeStatus === 'PENDING' || campaign.status === 'PENDING_MODERATION') {
    return pick(locale, {
      ru: 'VIP-баннер ожидает одобрения креатива. Период размещения начнётся после модерации.',
      kk: 'VIP-banner креатив бекітілуді күтуде. Орналастыру мерзімі модерациядан кейін басталады.',
    });
  }
  return null;
}

export function formatEffectivePeriodLabel(
  locale: AppLocale,
  campaign: { effectivePeriodStarted?: boolean },
): string | null {
  if (campaign.effectivePeriodStarted === false) {
    return pick(locale, { ru: 'Начнётся после одобрения', kk: 'Бекітілгеннен кейін басталады' });
  }
  return null;
}

const ANALYTICS_ACTION: Record<string, L> = {
  AD_CARD_OPEN: { ru: 'Открытия карточки', kk: 'Картаны ашу' },
  AD_CALL_CLICK: { ru: 'Звонки', kk: 'Қоңыраулар' },
  AD_WHATSAPP_CLICK: { ru: 'WhatsApp', kk: 'WhatsApp' },
  AD_ROUTE_CLICK: { ru: 'Маршруты', kk: 'Бағыттар' },
  AD_WEBSITE_CLICK: { ru: 'Сайт', kk: 'Сайт' },
  AD_INSTAGRAM_CLICK: { ru: 'Instagram', kk: 'Instagram' },
  AD_PROMOTION_OPEN: { ru: 'Открытия акции', kk: 'Акцияны ашу' },
};

export function analyticsActionLabel(locale: AppLocale, type: string): string {
  return pick(locale, ANALYTICS_ACTION[type] ?? { ru: type, kk: type });
}

const BUSINESS_ANALYTICS: Record<string, L> = {
  VIEW_BUSINESS: { ru: 'Просмотры карточки', kk: 'Картаны қарау' },
  CALL_CLICK: { ru: 'Звонки', kk: 'Қоңыраулар' },
  WHATSAPP_CLICK: { ru: 'WhatsApp', kk: 'WhatsApp' },
  ROUTE_CLICK: { ru: 'Маршруты', kk: 'Бағыттар' },
  FAVORITE_ADD: { ru: 'Добавления в избранное', kk: 'Таңдаулыларға қосу' },
  VIEW_PROMOTION: { ru: 'Просмотры акции', kk: 'Акцияны қарау' },
};

export function businessAnalyticsLabel(locale: AppLocale, type: string): string {
  return pick(locale, BUSINESS_ANALYTICS[type] ?? { ru: type, kk: type });
}

const CAMPAIGN_ANALYTICS: Record<string, L> = {
  served: { ru: 'Показы', kk: 'Көрсетулер' },
  servedCount: { ru: 'Показы', kk: 'Көрсетулер' },
  impressions: { ru: 'Просмотры', kk: 'Қараулар' },
  qualifiedImpressions: { ru: 'Просмотры', kk: 'Қараулар' },
  clicks: { ru: 'Клики', kk: 'Басулар' },
  clickCount: { ru: 'Клики', kk: 'Басулар' },
  ctr: { ru: 'CTR', kk: 'CTR' },
};

export function campaignAnalyticsLabel(locale: AppLocale, key: string): string {
  return pick(locale, CAMPAIGN_ANALYTICS[key] ?? { ru: key, kk: key });
}

const PERMISSION_LABELS: Record<PermissionCode, L> = {
  BUSINESS_PROFILE_EDIT: {
    ru: 'Редактирование профиля',
    kk: 'Профильді өңдеу',
  },
  BUSINESS_HOURS_EDIT: { ru: 'График работы', kk: 'Жұмыс уақыты' },
  CATALOG_EDIT: {
    ru: 'Товары и услуги',
    kk: 'Тауарлар мен қызметтер',
  },
  PHOTOS_EDIT: { ru: 'Фото и галерея', kk: 'Фото және галерея' },
  PROMOTIONS_EDIT: { ru: 'Акции', kk: 'Акциялар' },
  REVIEWS_REPLY: { ru: 'Ответы на отзывы', kk: 'Пікірлерге жауап' },
  ANALYTICS_VIEW: {
    ru: 'Просмотр статистики',
    kk: 'Статистиканы көру',
  },
  ANALYTICS_EXPORT: {
    ru: 'Экспорт статистики',
    kk: 'Статистиканы экспорттау',
  },
  ADS_MANAGE: {
    ru: 'Реклама и продвижение',
    kk: 'Жарнама және насихат',
  },
  PAYMENTS_VIEW: {
    ru: 'Просмотр платежей',
    kk: 'Төлемдерді көру',
  },
};

export function businessPermissionLabel(locale: AppLocale, permission: PermissionCode | string): string {
  const key = permission as PermissionCode;
  if (key in PERMISSION_LABELS) return pick(locale, PERMISSION_LABELS[key]);
  return permission;
}

const MEMBERSHIP_STATUS: Record<string, L> = {
  ACTIVE: { ru: 'Активен', kk: 'Белсенді' },
  SUSPENDED: { ru: 'Приостановлен', kk: 'Уақытша тоқтатылған' },
  REVOKED: { ru: 'Доступ отозван', kk: 'Қолжетімділік алынды' },
  INVITED: { ru: 'Приглашён', kk: 'Шақырылған' },
};

export function membershipStatusLabel(locale: AppLocale, status: string): string {
  return pick(locale, MEMBERSHIP_STATUS[status] ?? { ru: status, kk: status });
}

const MEMBERSHIP_ROLE: Record<string, L> = {
  OWNER: { ru: 'Владелец', kk: 'Ие' },
  MANAGER: { ru: 'Менеджер', kk: 'Менеджер' },
};

export function membershipRoleLabel(locale: AppLocale, role: string): string {
  return pick(locale, MEMBERSHIP_ROLE[role] ?? { ru: role, kk: role });
}

const PRESET_LABELS: Record<
  string,
  { label: L; description: L; permissions: PermissionCode[] }
> = {
  manager: {
    label: { ru: 'Управляющий', kk: 'Басқарушы' },
    description: {
      ru: 'Операционный доступ без управления командой',
      kk: 'Командасыз операциялық қолжетімділік',
    },
    permissions: [
      'BUSINESS_PROFILE_EDIT',
      'BUSINESS_HOURS_EDIT',
      'CATALOG_EDIT',
      'PHOTOS_EDIT',
      'PROMOTIONS_EDIT',
      'REVIEWS_REPLY',
      'ANALYTICS_VIEW',
      'ANALYTICS_EXPORT',
      'ADS_MANAGE',
      'PAYMENTS_VIEW',
    ],
  },
  content: {
    label: { ru: 'Контент-менеджер', kk: 'Контент-менеджер' },
    description: {
      ru: 'Профиль, каталог, фото и акции',
      kk: 'Профиль, каталог, фото және акциялар',
    },
    permissions: [
      'BUSINESS_PROFILE_EDIT',
      'BUSINESS_HOURS_EDIT',
      'CATALOG_EDIT',
      'PHOTOS_EDIT',
      'PROMOTIONS_EDIT',
    ],
  },
  marketing: {
    label: { ru: 'Маркетолог', kk: 'Маркетолог' },
    description: {
      ru: 'Акции, реклама и базовая аналитика',
      kk: 'Акциялар, жарнама және базалық аналитика',
    },
    permissions: ['PROMOTIONS_EDIT', 'ADS_MANAGE', 'ANALYTICS_VIEW'],
  },
  analytics: {
    label: { ru: 'Аналитик', kk: 'Аналитик' },
    description: {
      ru: 'Просмотр и экспорт статистики',
      kk: 'Статистиканы көру және экспорт',
    },
    permissions: ['ANALYTICS_VIEW', 'ANALYTICS_EXPORT'],
  },
};

export function permissionPresets(locale: AppLocale) {
  return Object.entries(PRESET_LABELS).map(([id, preset]) => ({
    id,
    label: pick(locale, preset.label),
    description: pick(locale, preset.description),
    permissions: preset.permissions,
  }));
}

export function paymentsAccessDeniedMessage(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Нет доступа к подписке и платежам. Обратитесь к владельцу бизнеса.',
    kk: 'Жазылым мен төлемдерге қолжетімділік жоқ. Бизнес иесіне хабарласыңыз.',
  });
}

const APPLICATION_STATUS: Record<string, L> = {
  DRAFT: { ru: 'Черновик', kk: 'Жоба' },
  PENDING: { ru: 'На проверке', kk: 'Тексеруде' },
  APPROVED: { ru: 'Одобрено', kk: 'Бекітілген' },
  REJECTED: { ru: 'Отклонено', kk: 'Қабылданбаған' },
  CANCELLED: { ru: 'Отменено', kk: 'Болдырылмаған' },
};

export function applicationStatusLabel(locale: AppLocale, status: string): string {
  return pick(locale, APPLICATION_STATUS[status] ?? { ru: status, kk: status });
}

export function claimStatusLabel(locale: AppLocale, status: string): string {
  return applicationStatusLabel(locale, status);
}

const PHOTO_PUBLISH: Record<string, L> = {
  published: { ru: 'Опубликовано', kk: 'Жарияланған' },
  hidden: {
    ru: 'Не публикуется по лимиту тарифа',
    kk: 'Тариф лимиті бойынша жарияланбайды',
  },
};

export function photoPublishLabel(
  locale: AppLocale,
  state: 'published' | 'hidden' | 'unknown',
): string | null {
  if (state === 'unknown') return null;
  return pick(locale, PHOTO_PUBLISH[state]);
}

const PLAN_USAGE_LABELS: Record<string, L> = {
  photos: { ru: 'Фото', kk: 'Фото' },
  serviceItems: { ru: 'Товары и услуги', kk: 'Тауарлар мен қызметтер' },
  activePromotions: { ru: 'Активные акции', kk: 'Белсенді акциялар' },
};

export function planUsageResourceLabel(locale: AppLocale, key: keyof typeof PLAN_USAGE_LABELS): string {
  return pick(locale, PLAN_USAGE_LABELS[key]);
}

export function planUsagePublishedSuffix(
  locale: AppLocale,
  published: number,
): string {
  return locale === 'kk'
    ? ` (жарияланған ${published})`
    : ` (опубликовано ${published})`;
}

export type PostLoginErrorKey = 'BUSINESSES_FETCH_FAILED' | 'NO_CABINET_ACCESS';

export function postLoginErrorMessage(locale: AppLocale, key: PostLoginErrorKey): string {
  const table: Record<PostLoginErrorKey, L> = {
    BUSINESSES_FETCH_FAILED: {
      ru: 'Не удалось проверить доступ к заведениям',
      kk: 'Мекемелерге қолжетімділікті тексеру сәтсіз',
    },
    NO_CABINET_ACCESS: {
      ru: 'Нет доступа к кабинету',
      kk: 'Кабинетке қолжетімділік жоқ',
    },
  };
  return pick(locale, table[key]);
}

export function manualPaymentNotice(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Оплата подтверждается администратором вручную. Автоматического списания нет — статус заказа обновится после подтверждения.',
    kk: 'Төлем әкімші қолмен растайды. Автоматты есептен шығару жоқ — тапсырыс статусы растаудан кейін жаңартылады.',
  });
}

export function vipPlanDisclaimer(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Рекламные размещения приобретаются отдельно.',
    kk: 'Жарнамалық орналастырулар бөлек сатып алынады.',
  });
}

export function vipModerationPlacementNotice(locale: AppLocale): string {
  return pick(locale, {
    ru: 'VIP-размещение не начнёт расходовать оплаченный срок, пока баннер не одобрен.',
    kk: 'VIP орналастыру баннер бекітілмейінше төленген мерзімді жұмсамайды.',
  });
}

export function photoOverLimitHint(locale: AppLocale): string {
  return pick(locale, {
    ru: 'На текущем тарифе публикуется ограниченное число фото. Остальные сохранены и снова появятся после повышения тарифа.',
    kk: 'Ағымдағы тарифте шектеулі фото жарияланады. Қалғандары сақталған және тарифті көтергеннен кейін қайта пайда болады.',
  });
}

export function formatDuration(locale: AppLocale, days: number | null | undefined, hours: number | null | undefined): string {
  if (days != null) {
    if (locale === 'kk') return `${days} күн`;
    if (days === 1) return '1 день';
    if (days >= 2 && days <= 4) return `${days} дня`;
    return `${days} дней`;
  }
  if (hours != null) {
    if (locale === 'kk') return `${hours} сағ`;
    if (hours === 1) return '1 час';
    if (hours >= 2 && hours <= 4) return `${hours} часа`;
    return `${hours} часов`;
  }
  return '—';
}

export function analyticsHeadlineForPlan(locale: AppLocale, plan: string | undefined): string {
  const table: Record<string, L> = {
    FREE: { ru: 'Сколько меня смотрят?', kk: 'Мені қаншалықты қарайды?' },
    BASIC: { ru: 'Что делают после просмотра?', kk: 'Қараудан кейін не істейді?' },
    PREMIUM: {
      ru: 'Откуда приходят клиенты и что работает?',
      kk: 'Клиенттер қайдан келеді және не жұмыс істейді?',
    },
    VIP: {
      ru: 'Почему это происходит и что можно улучшить?',
      kk: 'Неге бұл болады және не жақсартуға болады?',
    },
  };
  if (!plan) {
    return pick(locale, { ru: 'Статистика бизнеса', kk: 'Бизнес статистикасы' });
  }
  return pick(locale, table[plan] ?? { ru: 'Статистика бизнеса', kk: 'Бизнес статистикасы' });
}

export function actionMetricLabel(locale: AppLocale, key: string): string {
  const table: Record<string, L> = {
    total: { ru: 'Целевые действия', kk: 'Мақсатты әрекеттер' },
    calls: { ru: 'Звонки', kk: 'Қоңыраулар' },
    whatsapp: { ru: 'WhatsApp', kk: 'WhatsApp' },
    routes: { ru: 'Маршрут', kk: 'Бағыт' },
    website: { ru: 'Сайт', kk: 'Сайт' },
    instagram: { ru: 'Instagram', kk: 'Instagram' },
    favorites: { ru: 'Добавили в избранное', kk: 'Таңдаулыларға қосу' },
    promotionViews: { ru: 'Просмотры акций', kk: 'Акцияларды қарау' },
  };
  return pick(locale, table[key] ?? { ru: key, kk: key });
}

export function funnelStepLabel(locale: AppLocale, step: 'impressions' | 'views' | 'actions'): string {
  const table: Record<string, L> = {
    impressions: { ru: 'Показы', kk: 'Көрсетулер' },
    views: { ru: 'Просмотры', kk: 'Қараулар' },
    actions: { ru: 'Целевые действия', kk: 'Мақсатты әрекеттер' },
  };
  return pick(locale, table[step]);
}

export function menuUncategorizedLabel(locale: AppLocale): string {
  return pick(locale, { ru: 'Без группы', kk: 'Топтаусыз' });
}

export function recentProfileUpdated(locale: AppLocale): string {
  return pick(locale, { ru: 'Профиль обновлён', kk: 'Профиль жаңартылды' });
}

export function promotionActionTitle(locale: AppLocale, title: string): string {
  if (locale === 'kk') return `«${title}» акциясы`;
  return `Акция «${title}»`;
}

export function parseApiErrorMessage(locale: AppLocale, err: unknown): string {
  if (!(err instanceof Error)) {
    return pick(locale, { ru: 'Неизвестная ошибка', kk: 'Белгісіз қате' });
  }
  const raw = err.message;
  const rateLimit = pick(locale, {
    ru: 'Слишком много попыток. Попробуйте позже.',
    kk: 'Тым көп әрекет. Кейінірек көріңіз.',
  });
  if (raw.includes('429') || raw.toLowerCase().includes('too many')) return rateLimit;
  if (raw.includes('PAYMENTS_VIEW') || raw.includes('Missing permission')) {
    return paymentsAccessDeniedMessage(locale);
  }
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[]; statusCode?: number };
    if (parsed.statusCode === 429) return rateLimit;
    if (Array.isArray(parsed.message)) return parsed.message.join(', ');
    if (parsed.message) return String(parsed.message);
  } catch {
    /* not JSON */
  }
  return raw || pick(locale, { ru: 'Неизвестная ошибка', kk: 'Белгісиз қате' });
}

export function mapOnboardingErrorMessage(locale: AppLocale, raw: string): string {
  const lower = raw.toLowerCase();
  const refresh = pick(locale, {
    ru: 'Заявка уже отправлена или статус изменился. Обновите страницу.',
    kk: 'Өтінім жіберілген немесе статус өзгерген. Бетті жаңартыңыз.',
  });
  if (raw.includes('409') || lower.includes('conflict') || lower.includes('pending')) return refresh;
  if (lower.includes('duplicate') || lower.includes('already exists')) {
    return pick(locale, {
      ru: 'Похожий бизнес уже есть в QalaGo. Попробуйте найти существующий.',
      kk: 'Ұқсас бизнес QalaGo-да бар. Бар бизнесді табуға тырысыңыз.',
    });
  }
  if (lower.includes('already an active owner') || lower.includes('already have')) {
    return pick(locale, {
      ru: 'У вас уже есть права владельца этого бизнеса.',
      kk: 'Сізде бұл бизнес иесі ретінде құқық бар.',
    });
  }
  if (lower.includes('suspended') || lower.includes('revoked')) {
    return pick(locale, {
      ru: 'Доступ ограничен. Обратитесь к администратору.',
      kk: 'Қолжетімділік шектеулі. Әкімшіге хабарласыңыз.',
    });
  }
  if (lower.includes('not active') || lower.includes('inactive')) {
    return pick(locale, {
      ru: 'Этот бизнес пока недоступен для заявки.',
      kk: 'Бұл бизнес өтінім үшін әлі қолжетімсіз.',
    });
  }
  if (raw.includes('429') || lower.includes('too many')) {
    return pick(locale, {
      ru: 'Слишком много попыток. Попробуйте позже.',
      kk: 'Тым көп әрекет. Кейінірек көріңіз.',
    });
  }
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[] };
    const msg = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    if (msg) return mapOnboardingErrorMessage(locale, msg);
  } catch {
    /* not JSON */
  }
  return pick(locale, {
    ru: 'Не удалось выполнить действие. Попробуйте ещё раз.',
    kk: 'Әрекет орындалмады. Қайта көріңіз.',
  });
}

export function mapSocialAuthErrorMessage(
  locale: AppLocale,
  error: unknown,
  providerLabel: string,
): string {
  const message = error instanceof Error ? error.message : String(error);
  const tryAgain = pick(locale, {
    ru: `Не удалось войти через ${providerLabel}. Попробуйте ещё раз.`,
    kk: `${providerLabel} арқылы кіру сәтсіз. Қайта көріңіз.`,
  });
  if (message.includes('404') || message.includes('Not Found')) {
    return pick(locale, {
      ru: `Вход через ${providerLabel} временно недоступен.`,
      kk: `${providerLabel} арқылы кіру уақытша қолжетімсіз.`,
    });
  }
  if (message.includes('429') || message.toLowerCase().includes('too many')) {
    return pick(locale, {
      ru: 'Слишком много попыток. Попробуйте позже.',
      kk: 'Тым көп әрекет. Кейінірек көріңіз.',
    });
  }
  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('network')
  ) {
    return pick(locale, {
      ru: 'Не удалось подключиться. Попробуйте ещё раз.',
      kk: 'Қосылу сәтсіз. Қайта көріңіз.',
    });
  }
  if (message.includes('popup') || message.includes('blocked')) {
    return pick(locale, {
      ru: 'Не удалось открыть окно входа. Разрешите всплывающие окна.',
      kk: 'Кіру терезесін ашу сәтсіз. Pop-up терезелерге рұқсат беріңіз.',
    });
  }
  return tryAgain;
}

export function mapAnalyticsExportError(locale: AppLocale, err: unknown): string {
  const raw = String(err);
  if (raw.includes('403') || raw.toLowerCase().includes('forbidden')) {
    return pick(locale, {
      ru: 'Нет прав на экспорт отчёта. Обратитесь к владельцу бизнеса.',
      kk: 'Есепті экспорттау құқығы жоқ. Бизнес иесіне хабарласыңыз.',
    });
  }
  if (raw.includes('401')) {
    return pick(locale, {
      ru: 'Сессия истекла. Войдите снова.',
      kk: 'Сессия аяқталды. Қайта кіріңіз.',
    });
  }
  return pick(locale, {
    ru: 'Не удалось сформировать отчёт. Попробуйте позже.',
    kk: 'Есеп қалыптасқан жоқ. Кейінірек көріңіз.',
  });
}

export function mapAnalyticsLoadError(locale: AppLocale, err: unknown): string {
  const raw = String(err);
  if (raw.includes('403') || raw.toLowerCase().includes('forbidden')) {
    return pick(locale, {
      ru: 'Нет доступа к аналитике для этого бизнеса.',
      kk: 'Бұл бизнес аналитикасына қолжетімділік жоқ.',
    });
  }
  return pick(locale, {
    ru: 'Не удалось загрузить статистику. Проверьте подключение и попробуйте снова.',
    kk: 'Статистиканы жүктеу сәтсіз. Байланысты тексеріп, қайта көріңіз.',
  });
}

export function navLabelForId(locale: AppLocale, id: string): string {
  const map: Record<string, L> = {
    home: { ru: 'Обзор', kk: 'Шолу' },
    profile: { ru: 'Мой бизнес', kk: 'Менің бизнесім' },
    menu: { ru: 'Товары и услуги', kk: 'Тауарлар мен қызметтер' },
    promotions: { ru: 'Акции', kk: 'Акциялар' },
    monetization: { ru: 'Реклама и продвижение', kk: 'Жарнама және насихат' },
    stats: { ru: 'Статистика', kk: 'Статистика' },
    settings: { ru: 'Настройки', kk: 'Баптаулар' },
    team: { ru: 'Команда', kk: 'Команда' },
    plan: { ru: 'Тариф', kk: 'Тариф' },
    help: { ru: 'Помощь', kk: 'Көмек' },
    media: { ru: 'Галерея', kk: 'Галерея' },
    reviews: { ru: 'Отзывы', kk: 'Пікірлер' },
    messages: { ru: 'Сообщения', kk: 'Хабарламалар' },
  };
  return pick(locale, map[id] ?? { ru: id, kk: id });
}
