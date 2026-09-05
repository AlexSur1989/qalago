// Centralized monetization UI labels (RU). Structure ready for KZ later.

const monetizationProductCodes = {
  'BOOST',
  'TOP_CATEGORY',
  'PROMOTED_PROMOTION',
  'FEATURED_BUSINESS',
  'VIP_BANNER',
};

const productTitleRu = <String, String>{
  'BOOST': 'Поднять карточку',
  'TOP_CATEGORY': 'TOP категории',
  'PROMOTED_PROMOTION': 'Продвинуть акцию',
  'FEATURED_BUSINESS': 'Популярное место',
  'VIP_BANNER': 'VIP-баннер',
};

const productDescriptionRu = <String, String>{
  'BOOST': 'Дополнительная видимость вашего бизнеса в категории.',
  'TOP_CATEGORY':
      'Ваш бизнес показывается в приоритетном рекламном блоке своей категории.',
  'PROMOTED_PROMOTION':
      'Ваша акция получает дополнительное рекламное размещение в QalaGo.',
  'FEATURED_BUSINESS':
      'Ваш бизнес получает дополнительное размещение на главной странице.',
  'VIP_BANNER': 'Большой рекламный баннер на главной странице QalaGo.',
};

const productTopCategoryNote =
    'Позиции распределяются автоматически между активными рекламодателями.';

String productTitle(String code) => productTitleRu[code] ?? code;

String productDescription(String code) =>
    productDescriptionRu[code] ?? 'Рекламное размещение в QalaGo.';

String orderStatusLabel(String status) {
  switch (status) {
    case 'AWAITING_PAYMENT':
      return 'Ожидает оплаты';
    case 'PAID':
      return 'Оплачен';
    case 'DRAFT':
      return 'Черновик';
    case 'CANCELLED':
      return 'Отменён';
    case 'REFUNDED':
      return 'Возврат';
    case 'PARTIALLY_REFUNDED':
      return 'Частичный возврат';
    default:
      return status;
  }
}

String campaignStatusLabel(String status) {
  switch (status) {
    case 'PENDING_MODERATION':
      return 'На модерации';
    case 'AWAITING_PAYMENT':
      return 'Ожидает оплаты';
    case 'SCHEDULED':
      return 'Запланировано';
    case 'ACTIVE':
      return 'Активно';
    case 'PAUSED':
      return 'Приостановлено';
    case 'COMPLETED':
      return 'Завершено';
    case 'CANCELLED':
      return 'Отменено';
    case 'REJECTED':
      return 'Отклонено';
    default:
      return status;
  }
}

String creativeModerationLabel(String status) {
  switch (status) {
    case 'DRAFT':
      return 'Черновик';
    case 'PENDING':
      return 'На проверке';
    case 'APPROVED':
      return 'Одобрен';
    case 'REJECTED':
      return 'Отклонён';
    default:
      return status;
  }
}

String analyticsActionLabel(String type) {
  const map = {
    'AD_CARD_OPEN': 'Открытия карточки',
    'AD_CALL_CLICK': 'Звонки',
    'AD_WHATSAPP_CLICK': 'WhatsApp',
    'AD_ROUTE_CLICK': 'Маршруты',
    'AD_WEBSITE_CLICK': 'Сайт',
    'AD_INSTAGRAM_CLICK': 'Instagram',
    'AD_PROMOTION_OPEN': 'Открытия акции',
  };
  return map[type] ?? type;
}

const vipModerationNotice =
    'VIP-баннер будет опубликован после проверки модератором. '
    'Оплаченный период начнётся только после одобрения баннера.';

const paymentInfoNotice =
    'После подтверждения оплаты продвижение будет активировано автоматически.';

const paymentMethodUnavailableNotice =
    'Способ оплаты будет доступен после подключения платёжного сервиса.';

const ctrTooltip =
    'CTR — доля переходов от количества засчитанных просмотров рекламы.';
