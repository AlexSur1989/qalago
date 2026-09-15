// ignore_for_file: avoid_print
import 'dart:convert';
import 'dart:io';

/// One-off: merge Stage 6.10B.3 owner/monetization keys into app_ru.arb / app_kk.arb.
void main() {
  final ru = _ru();
  final kk = _kk();
  _merge('lib/l10n/app_ru.arb', ru);
  _merge('lib/l10n/app_kk.arb', kk);
  print('Merged ${ru.length} keys into RU and KK arb files.');
}

void _merge(String path, Map<String, dynamic> entries) {
  final file = File(path);
  var text = file.readAsStringSync().trimRight();
  if (!text.endsWith('}')) {
    throw StateError('$path: expected trailing }');
  }
  text = text.substring(0, text.length - 1).trimRight();
  if (!text.endsWith(',')) text = '$text,';
  final buffer = StringBuffer(text);
  buffer.writeln();
  for (final entry in entries.entries) {
    _writeEntry(buffer, entry.key, entry.value);
  }
  buffer.writeln('}');
  file.writeAsStringSync('${buffer.toString()}\n');
}

void _writeEntry(StringBuffer buffer, String key, dynamic value) {
  if (value is String) {
    buffer.writeln('  ${jsonEncode(key)}: ${jsonEncode(value)},');
    return;
  }
  if (value is Map<String, dynamic>) {
    buffer.writeln('  ${jsonEncode(key)}: ${jsonEncode(value['value'])},');
    final meta = value['meta'];
    if (meta != null) {
      buffer.writeln('  ${jsonEncode('@$key')}: ${jsonEncode(meta)},');
    }
  }
}

Map<String, dynamic> _ru() => {
      'ownerPlanTierFree': 'Бесплатный',
      'ownerPlanTierBasic': 'Бизнес',
      'ownerPlanTierPremium': 'PRO',
      'ownerPlanTierVip': 'VIP',
      'ownerStatusActive': 'Активен',
      'ownerStatusPendingModeration': 'На модерации',
      'ownerStatusBlocked': 'Заблокирован',
      'ownerPromotionStatusActive': 'Активна',
      'ownerPromotionStatusExpired': 'Истекла',
      'ownerPromotionFeedHint':
          'Продвижение в ленте города — через рекламные продукты',
      'ownerNotificationReviewNew': 'Новый отзыв',
      'ownerNotificationReviewReply': 'Ответ на отзыв',
      'ownerNotificationModeration': 'Модерация',
      'ownerNotificationPromotion': 'Акция',
      'ownerNotificationPlan': 'Тариф',
      'ownerNotificationGeneral': 'Общее',
      'ownerKpiViews': 'Просмотры',
      'ownerKpiCalls': 'Звонки',
      'ownerKpiRoutes': 'Маршруты',
      'ownerKpiFavorites': 'Избранное',
      'ownerAnalyticsFavorites': 'В избранное',
      'ownerAnalyticsDeltaPositive': '+{percent}% к предыдущему периоду',
      '@ownerAnalyticsDeltaPositive': {
        'placeholders': {'percent': {'type': 'int'}}
      },
      'ownerAnalyticsDeltaNegative': '{percent}% к предыдущему периоду',
      '@ownerAnalyticsDeltaNegative': {
        'placeholders': {'percent': {'type': 'int'}}
      },
      'ownerAnalyticsDeltaZero': '0% к предыдущему периоду',
      'ownerAnalyticsUpgradeActions': 'Доступно в тарифе Бизнес',
      'ownerAnalyticsUpgradeSources':
          'Источники, поисковые запросы и CTR доступны в PRO',
      'ownerAnalyticsUpgradeAudience': 'Analytics 360 доступна в VIP',
      'ownerPermissionProfileEdit': 'Редактирование профиля',
      'ownerPermissionHoursEdit': 'График работы',
      'ownerPermissionCatalogEdit': 'Товары и услуги',
      'ownerPermissionPhotosEdit': 'Фото и галерея',
      'ownerPermissionPromotionsEdit': 'Акции',
      'ownerPermissionReviewsReply': 'Ответы на отзывы',
      'ownerPermissionAnalyticsView': 'Просмотр статистики',
      'ownerPermissionAnalyticsExport': 'Экспорт статистики',
      'ownerPermissionAdsManage': 'Реклама и продвижение',
      'ownerPermissionPaymentsView': 'Просмотр платежей',
      'ownerMembershipStatusActive': 'Активен',
      'ownerMembershipStatusSuspended': 'Приостановлен',
      'ownerMembershipStatusRevoked': 'Доступ отозван',
      'ownerMembershipStatusInvited': 'Приглашён',
      'ownerPresetManager': 'Управляющий',
      'ownerPresetManagerDesc': 'Операционный доступ без управления командой',
      'ownerPresetContent': 'Контент-менеджер',
      'ownerPresetContentDesc': 'Профиль, каталог, фото и акции',
      'ownerPresetMarketing': 'Маркетолог',
      'ownerPresetMarketingDesc': 'Акции, реклама и базовая аналитика',
      'ownerPresetAnalytics': 'Аналитик',
      'ownerPresetAnalyticsDesc': 'Просмотр и экспорт статистики',
      'ownerPermissionsMore': '{head} · +{count}',
      '@ownerPermissionsMore': {
        'placeholders': {
          'head': {'type': 'String'},
          'count': {'type': 'int'},
        }
      },
      'monetizationProductBoost': 'Поднять карточку',
      'monetizationProductTopCategory': 'TOP категории',
      'monetizationProductPromotedPromotion': 'Продвинуть акцию',
      'monetizationProductFeaturedBusiness': 'Популярное место',
      'monetizationProductVipBanner': 'VIP-баннер',
      'monetizationProductBoostDesc':
          'Дополнительная видимость вашего бизнеса в категории.',
      'monetizationProductTopCategoryDesc':
          'Ваш бизнес показывается в приоритетном рекламном блоке своей категории.',
      'monetizationProductPromotedPromotionDesc':
          'Ваша акция получает дополнительное рекламное размещение в QalaGo.',
      'monetizationProductFeaturedBusinessDesc':
          'Ваш бизнес получает дополнительное размещение на главной странице.',
      'monetizationProductVipBannerDesc':
          'Большой рекламный баннер на главной странице QalaGo.',
      'monetizationProductDefaultDesc': 'Рекламное размещение в QalaGo.',
      'monetizationProductTopCategoryNote':
          'Позиции распределяются автоматически между активными рекламодателями.',
      'monetizationOrderAwaitingPayment': 'Ожидает оплаты',
      'monetizationOrderPaid': 'Оплачен',
      'monetizationOrderRefunded': 'Возврат',
      'monetizationOrderPartialRefund': 'Частичный возврат',
      'monetizationCampaignPendingModeration': 'На модерации',
      'monetizationCampaignScheduled': 'Запланирована',
      'monetizationCampaignPaused': 'Приостановлено',
      'monetizationCampaignCompleted': 'Завершено',
      'monetizationCreativePending': 'На проверке',
      'monetizationCreativeApproved': 'Одобрен',
      'monetizationAnalyticsCardOpen': 'Открытия карточки',
      'monetizationAnalyticsPromotionOpen': 'Открытия акции',
      'monetizationPurchaseAvailable': 'Доступно',
      'monetizationPurchaseActive': 'Активно',
      'monetizationPurchaseSoldOut': 'Мест нет',
      'monetizationActionBuy': 'Купить',
      'monetizationActionContinuePayment': 'Продолжить оплату',
      'monetizationActionRenew': 'Продлить',
      'monetizationReasonPendingOrder':
          'У вас уже есть неоплаченный заказ на это размещение.',
      'monetizationReasonConflict': 'Размещение конфликтует с текущим графиком.',
      'monetizationReasonAlreadyActive': 'Размещение уже активно.',
      'monetizationReasonAlreadyScheduled': 'Размещение уже запланировано.',
      'monetizationReasonTargetPromoted': 'Эта акция уже продвигается.',
      'monetizationReasonCategoryIneligible':
          'Категория не подходит для этого продукта.',
      'monetizationReasonPromotionIneligible': 'Акция недоступна для продвижения.',
      'monetizationReasonSoldOut': 'Свободных мест нет на выбранный период.',
      'monetizationReasonPackageConflict':
          'Компоненты пакета не укладываются в доступные слоты.',
      'monetizationReasonReservationExpired':
          'Резерв места истёк — обновите статус и попробуйте снова.',
      'monetizationReasonGeneric': 'Не удалось выполнить операцию.',
      'monetizationReasonGenericWithCode': 'Не удалось выполнить операцию ({code}).',
      '@monetizationReasonGenericWithCode': {
        'placeholders': {'code': {'type': 'String'}}
      },
      'monetizationVipModerationNotice':
          'VIP-баннер будет опубликован после проверки модератором. Оплаченный период начнётся только после одобрения баннера.',
      'monetizationPackageVipNotice':
          'Пакет включает VIP-баннер. Для запуска VIP-размещения необходимо настроить баннер и пройти модерацию.',
      'monetizationPackageVipCta': 'Настроить VIP-баннер',
      'monetizationPaymentInfoNotice':
          'После подтверждения оплаты продвижение будет активировано автоматически.',
      'monetizationPaymentMethodUnavailable':
          'Способ оплаты будет доступен после подключения платёжного сервиса.',
      'monetizationCtrTooltip':
          'CTR — доля переходов от количества засчитанных просмотров рекламы.',
      'ownerInvitationStatusPending': 'Приглашение активно',
      'ownerInvitationStatusAccepted': 'Приглашение уже принято',
      'ownerInvitationStatusRevoked': 'Приглашение отозвано',
      'ownerInvitationStatusExpired': 'Срок приглашения истёк',
      'ownerDurationDays': '{count} {unit}',
      '@ownerDurationDays': {
        'placeholders': {
          'count': {'type': 'int'},
          'unit': {'type': 'String'},
        }
      },
      'ownerDurationHours': '{count} ч',
      '@ownerDurationHours': {
        'placeholders': {'count': {'type': 'int'}}
      },
      'ownerDayUnitOne': 'день',
      'ownerDayUnitFew': 'дня',
      'ownerDayUnitMany': 'дней',
      'ownerNavOverview': 'Обзор',
      'ownerNavAnalytics': 'Статистика',
      'ownerNavPromote': 'Реклама и продвижение',
      'ownerNavMessages': 'Сообщения',
      'ownerNavPlan': 'Тариф',
      'ownerNavTeam': 'Команда',
      'ownerNavSettings': 'Настройки',
      'ownerNavHelp': 'Помощь',
      'ownerNavBackToApp': 'В приложение QalaGo',
      'ownerBusinessDrawerTitle': 'QalaGo Business',
      'ownerDashboardTitle': 'Кабинет бизнеса',
      'ownerAddBusiness': 'Добавить',
      'ownerBusinessLabel': 'Заведение',
      'ownerWelcome': 'Добро пожаловать, {title}!',
      '@ownerWelcome': {
        'placeholders': {'title': {'type': 'String'}}
      },
      'ownerNoBusinessesTitle': 'Нет заведений',
      'ownerNoBusinessesBody':
          'Зарегистрируйте заведение — после модерации оно появится в QalaGo.',
      'ownerRegisterBusiness': 'Зарегистрировать заведение',
      'ownerSummaryWeek': '{views} просмотров · {actions} действий за 7 дней',
      '@ownerSummaryWeek': {
        'placeholders': {
          'views': {'type': 'int'},
          'actions': {'type': 'int'},
        }
      },
      'ownerDeltaWeek': '{delta} за нед.',
      '@ownerDeltaWeek': {
        'placeholders': {'delta': {'type': 'String'}}
      },
      'ownerViewsChartTitle': 'Просмотры за 7 дней',
      'ownerTrendsLockedHint':
          'График действий по дням доступен на тарифе «Бизнес» и выше.',
      'ownerPlanUsageTitle': 'Использование тарифа',
      'ownerProfileCard': 'Профиль',
      'ownerProfileCompletion': '{percent}% заполнено',
      '@ownerProfileCompletion': {
        'placeholders': {'percent': {'type': 'int'}}
      },
      'ownerFillProfile': 'Заполнить',
      'ownerUpgradePlan': 'Улучшить',
      'ownerActivePromotions': 'Активные акции',
      'ownerNoActivePromotions': 'Нет активных акций',
      'ownerPromoteCatalogSubtitle':
          'VIP-баннер, TOP категории, продвижение акций и пакеты',
      'ownerOpenCatalog': 'Открыть каталог',
      'ownerMyCampaigns': 'Мои кампании',
      'ownerManagementSection': 'Управление',
      'ownerPreviewCard': 'Предпросмотр карточки',
      'ownerMgmtMyBusiness': 'Мой бизнес',
      'ownerMgmtGallery': 'Галерея',
      'ownerMgmtPromotions': 'Акции',
      'ownerMgmtReviews': 'Отзывы',
      'ownerErrorWithDetails': 'Ошибка: {details}',
      '@ownerErrorWithDetails': {
        'placeholders': {'details': {'type': 'String'}}
      },
      'ownerSaving': 'Сохранение…',
      'ownerSubmitting': 'Отправка…',
      'ownerConfirm': 'Подтвердить',
      'ownerRevoke': 'Отозвать',
      'ownerDefaultBusiness': 'Заведение',
      'ownerDefaultMember': 'Участник',
      'ownerDefaultManager': 'Менеджер',
      'ownerDefaultUser': 'Пользователь',
      'ownerTeamNoAccessTitle': 'Нет доступа',
      'ownerTeamNoAccessBody':
          'Управление командой доступно только владельцу заведения.',
      'ownerGoHome': 'На главную',
      'ownerInvite': 'Пригласить',
      'ownerTeamMembers': 'Участники',
      'ownerTeamNoMembers': 'Нет участников',
      'ownerTeamPendingInvites': 'Ожидают приглашения',
      'ownerTeamNoPendingInvites': 'Нет ожидающих приглашений',
      'ownerTeamPlanNoManagers': 'Тариф не включает менеджеров.',
      'ownerTeamManagerLimit': 'Достигнут лимит менеджеров вашего тарифа.',
      'ownerViewPlans': 'Посмотреть тарифы',
      'ownerTeamManagersUnavailable': 'Менеджеры недоступны на текущем тарифе',
      'ownerTeamManagersUsage': 'Менеджеры: {used} из {limit}',
      '@ownerTeamManagersUsage': {
        'placeholders': {
          'used': {'type': 'int'},
          'limit': {'type': 'int'},
        }
      },
      'ownerTeamManagersExtra':
          ' ({active} активных · {pending} ожидают)',
      '@ownerTeamManagersExtra': {
        'placeholders': {
          'active': {'type': 'int'},
          'pending': {'type': 'int'},
        }
      },
      'ownerSuspendManagerTitle': 'Приостановить доступ менеджера?',
      'ownerSuspendManagerBody':
          'Менеджер временно потеряет доступ к управлению бизнесом.',
      'ownerAccessSuspended': 'Доступ приостановлен',
      'ownerAccessRestored': 'Доступ восстановлен',
      'ownerRevokeManagerTitle': 'Удалить доступ менеджера?',
      'ownerRevokeManagerBody':
          'Менеджер больше не сможет управлять этим бизнесом.',
      'ownerAccessRevoked': 'Доступ отозван',
      'ownerEditPermissions': 'Изменить права',
      'ownerSuspend': 'Приостановить',
      'ownerRemoveAccess': 'Удалить доступ',
      'ownerRestore': 'Восстановить',
      'ownerRevokeInviteTitle': 'Отозвать приглашение?',
      'ownerRevokeInviteBody': 'Отозвать приглашение для {email}?',
      '@ownerRevokeInviteBody': {
        'placeholders': {'email': {'type': 'String'}}
      },
      'ownerInviteRevoked': 'Приглашение отозвано',
      'ownerInviteStatusLine': '{status} · до {expires}',
      '@ownerInviteStatusLine': {
        'placeholders': {
          'status': {'type': 'String'},
          'expires': {'type': 'String'},
        }
      },
      'ownerInvalidEmail': 'Укажите корректный email',
      'ownerSelectPermission': 'Выберите хотя бы одно право доступа',
      'ownerInviteCreated': 'Приглашение создано',
      'ownerManagerAdded': 'Менеджер добавлен в команду',
      'ownerInviteManagerTitle': 'Пригласить менеджера',
      'ownerInviteManagerBody':
          'Укажите email и права. После создания отправьте ссылку менеджеру.',
      'ownerAccessPermissions': 'Права доступа',
      'ownerInviteLinkHint':
          'Отправьте эту ссылку менеджеру. Она одноразовая и действует ограниченное время.',
      'ownerLinkCopied': 'Ссылка скопирована',
      'ownerCopyLink': 'Скопировать ссылку',
      'ownerSendInvite': 'Отправить приглашение',
      'ownerPermissionsUpdated': 'Права обновлены',
      'ownerManagerPermissionsTitle': 'Права менеджера',
      'ownerMonetizationTitle': 'Реклама и продвижение',
      'ownerSelectBusinessFirst': 'Сначала выберите заведение',
      'ownerChoosePromotionMethod': 'Выберите способ продвижения',
      'ownerPriceLoadFailed': 'Не удалось получить цены. Проверьте подключение.',
      'ownerProductsUnavailable': 'Рекламные продукты временно недоступны.',
      'ownerReadyPackages': 'Готовые пакеты',
      'ownerPackagesLoadFailed': 'Не удалось загрузить пакеты.',
      'ownerMyPromotions': 'Мои продвижения',
      'ownerMyOrders': 'Мои заказы',
      'ownerProductTitle': 'Продукт',
      'ownerBusinessNotSelected': 'Заведение не выбрано',
      'ownerPriceFailedShort': 'Не удалось получить цены.',
      'ownerProductNotFound': 'Продукт не найден',
      'ownerPeriodLabel': 'Период',
      'ownerStartLabel': 'Начало',
      'ownerStartAfterPayment': 'Сразу после оплаты',
      'ownerPickDate': 'Выбрать дату',
      'ownerSelectDate': 'Выберите дату',
      'ownerDiscountPercent': 'Скидка {percent}%',
      '@ownerDiscountPercent': {
        'placeholders': {'percent': {'type': 'String'}}
      },
      'ownerGetQuote': 'Получить стоимость',
      'ownerQuoteFailed': 'Не удалось получить стоимость.',
      'ownerPromotionsLoadFailed': 'Не удалось загрузить акции.',
      'ownerCreatePromotionFirst': 'Сначала создайте активную акцию.',
      'ownerCreatePromotion': 'Создать акцию',
      'ownerSelectPromotion': 'Выберите акцию',
      'ownerActiveUntil': 'Активно до {date}',
      '@ownerActiveUntil': {
        'placeholders': {'date': {'type': 'String'}}
      },
      'ownerNextAvailableDate': 'Ближайшая доступная дата: {date}',
      '@ownerNextAvailableDate': {
        'placeholders': {'date': {'type': 'String'}}
      },
      'ownerReservedUntil': 'Место зарезервировано до {date}',
      '@ownerReservedUntil': {
        'placeholders': {'date': {'type': 'String'}}
      },
      'ownerPriceFrom': 'от {price}',
      '@ownerPriceFrom': {
        'placeholders': {'price': {'type': 'String'}}
      },
      'ownerCostLabel': 'Стоимость',
      'ownerTotalLabel': 'Итого',
      'ownerSlotsOccupied': 'На выбранный период рекламные места заняты.',
      'ownerSettingsTitle': 'Настройки',
      'ownerAccountSection': 'Аккаунт',
      'ownerPhoneLabel': 'Телефон',
      'ownerPhoneMissing': 'Телефон не указан',
      'ownerDisplayNameLabel': 'Имя владельца',
      'ownerDisplayNameHint': 'Как отображать в кабинете',
      'ownerNameSaved': 'Имя сохранено',
      'ownerBusinessSection': 'Заведение',
      'ownerBusinessSettingsHint':
          'Редактируйте карточку, часы и контакты в профиле.',
      'ownerGallery': 'Галерея',
      'ownerNoBusinessApply':
          'Нет заведения — подайте заявку на модерацию.',
      'ownerRegister': 'Зарегистрировать',
      'ownerSecuritySection': 'Безопасность',
      'ownerSecurityHint':
          'Вход по SMS-коду. Для смены номера обратитесь в поддержку.',
      'ownerReviewReplySaved': 'Ответ сохранён',
      'ownerReviewsTitle': 'Отзывы · {title}',
      '@ownerReviewsTitle': {
        'placeholders': {'title': {'type': 'String'}}
      },
      'ownerNoReviews': 'Пока нет отзывов',
      'ownerReviewsSummary': '{total} отзывов{unanswered}',
      '@ownerReviewsSummary': {
        'placeholders': {
          'total': {'type': 'int'},
          'unanswered': {'type': 'String'},
        }
      },
      'ownerReviewsUnansweredSuffix': ' · {count} без ответа',
      '@ownerReviewsUnansweredSuffix': {
        'placeholders': {'count': {'type': 'int'}}
      },
      'ownerYourReply': 'Ваш ответ: {reply}',
      '@ownerYourReply': {
        'placeholders': {'reply': {'type': 'String'}}
      },
      'ownerReplyLabel': 'Ответ владельца',
      'ownerReplyAction': 'Ответить',
      'ownerUpdateReply': 'Обновить',
      'ownerPromotionLimit': 'Лимит активных акций: {max}. Улучшите тариф.',
      '@ownerPromotionLimit': {
        'placeholders': {'max': {'type': 'int'}}
      },
      'ownerNewPromotion': 'Новая акция',
      'ownerEditPromotion': 'Редактировать акцию',
      'ownerFieldTitle': 'Название',
      'ownerFieldDiscount': 'Скидка',
      'ownerFieldDescription': 'Описание',
      'ownerFieldStatus': 'Статус',
      'ownerPromotionStatusCompleted': 'Завершена',
      'ownerCreate': 'Создать',
      'ownerPromotionCreated': 'Акция создана',
      'ownerPromotionUpdated': 'Акция обновлена',
      'ownerDeletePromotionTitle': 'Удалить акцию?',
      'ownerDeletePromotionBody': '«{title}» будет удалена без восстановления.',
      '@ownerDeletePromotionBody': {
        'placeholders': {'title': {'type': 'String'}}
      },
      'ownerPromotionDeleted': 'Акция удалена',
      'ownerPromotionsTitle': 'Акции · {title}',
      '@ownerPromotionsTitle': {
        'placeholders': {'title': {'type': 'String'}}
      },
      'ownerNoPromotions': 'Пока нет акций',
      'ownerNoPromotionsHint': 'Создайте первую акцию для привлечения гостей',
      'ownerActivePromotionsCount': 'Активных: {active} / {max}',
      '@ownerActivePromotionsCount': {
        'placeholders': {
          'active': {'type': 'int'},
          'max': {'type': 'int'},
        }
      },
      'ownerEdit': 'Редактировать',
      'ownerPlanTitle': 'Тариф',
      'ownerRegisterBusinessFirst': 'Сначала зарегистрируйте заведение',
      'ownerPlanUpdated': 'Тариф обновлён',
      'ownerPlanCurrent': 'Текущий: {name}',
      '@ownerPlanCurrent': {
        'placeholders': {'name': {'type': 'String'}}
      },
      'ownerPlanPromoteSubtitle': 'TOP, VIP-баннер, пакеты и статистика',
      'ownerPlanPeriodMonth': 'месяц',
      'ownerPlanPeriodDays': '{days} дн.',
      '@ownerPlanPeriodDays': {
        'placeholders': {'days': {'type': 'int'}}
      },
      'ownerMenuEmpty': 'Пока нет позиций в меню',
      'ownerMenuOtherGroup': 'Прочее',
      'ownerTeamForbidden': 'У вас нет прав для этого действия.',
      'ownerTeamNotFound': 'Запись не найдена.',
      'ownerTeamActionFailed': 'Не удалось выполнить действие. Попробуйте позже.',
      'ownerInviteNotFound':
          'Приглашение не найдено или ссылка недействительна.',
      'ownerAcceptingInvite': 'Принимаем…',
      'ownerAcceptInvite': 'Принять приглашение',
      'ownerGalleryTitle': 'Галерея · {title}',
      '@ownerGalleryTitle': {
        'placeholders': {'title': {'type': 'String'}}
      },
      'ownerPhotoLimitSnackbar':
          'Лимит тарифа: не более {max} фото. Улучшите тариф в разделе «Тариф».',
      '@ownerPhotoLimitSnackbar': {
        'placeholders': {'max': {'type': 'int'}}
      },
      'ownerCoverUpdated': 'Обложка обновлена',
      'ownerPhotoAdded': 'Фото добавлено',
      'ownerUploadError': 'Ошибка загрузки: {details}',
      '@ownerUploadError': {
        'placeholders': {'details': {'type': 'String'}}
      },
      'ownerPhotosUsage': 'Фото: {used} / {max}{suffix}',
      '@ownerPhotosUsage': {
        'placeholders': {
          'used': {'type': 'int'},
          'max': {'type': 'int'},
          'suffix': {'type': 'String'},
        }
      },
      'ownerPhotoLimitReached': ' · лимит достигнут',
      'ownerGalleryEmpty': 'Галерея пустая',
      'ownerGalleryEmptyHint': 'Добавьте фото интерьера, блюд или услуг',
      'ownerCoverLabel': 'Обложка',
      'ownerSetCover': 'Сделать обложкой',
      'ownerPhotoLabel': 'Фото',
      'ownerEditProfileTitle': 'Профиль заведения',
      'ownerFieldShortDesc': 'Краткое описание',
      'ownerFieldFullDesc': 'Полное описание',
      'ownerContactsSection': 'Контакты',
      'ownerWorkHoursSection': 'График работы',
      'ownerWorkHoursFormat': 'Формат: 09:00-22:00',
      'ownerWorkHoursWeekdays': 'Пн–Пт',
      'ownerWorkHoursSaturday': 'Суббота',
      'ownerWorkHoursSunday': 'Воскресенье',
      'ownerRequiredNameAddress': 'Заполните название и адрес',
      'ownerProfileSaved': 'Профиль заведения сохранён',
      'ownerAnalyticsTitle': 'Статистика',
      'ownerAnalyticsAds': 'Реклама',
      'ownerAnalyticsLoadFailed':
          'Не удалось загрузить статистику. Проверьте сеть и попробуйте снова.',
      'ownerAnalyticsPeriodDays': '{days} дн',
      '@ownerAnalyticsPeriodDays': {
        'placeholders': {'days': {'type': 'int'}}
      },
      'ownerAnalyticsOverview': 'Обзор',
      'ownerAnalyticsTargetActions': 'Целевые действия',
      'ownerAnalyticsAdsStats': 'Статистика рекламы',
      'ownerAnalyticsAcquisition': 'Привлечение',
      'ownerAnalyticsSourcesPro': 'Источники доступны в PRO',
      'ownerAnalyticsSourcesEmpty': 'Источники',
      'ownerAnalyticsNotEnoughData': 'Недостаточно данных',
      'ownerAnalyticsSearchQueries': 'Что ищут пользователи',
      'ownerAnalyticsSearchEmpty':
          'Недостаточно данных для анализа поисковых запросов',
      'ownerAnalyticsSearchPro': 'Поисковые запросы доступны в PRO',
      'ownerExportFailed': 'Не удалось подготовить отчёт. Попробуйте ещё раз.',
      'ownerExportForbidden':
          'Экспорт недоступен для вашей роли или тарифа.',
      'ownerExportCsv': 'Экспорт CSV',
      'ownerExportPreparing': 'Формирование…',
      'ownerSearchOtherQueries': 'Другие запросы — {count}',
      '@ownerSearchOtherQueries': {
        'placeholders': {'count': {'type': 'String'}}
      },
      'ownerSearchTransitions': '{count} переходов',
      '@ownerSearchTransitions': {
        'placeholders': {'count': {'type': 'String'}}
      },
      'ownerSourcesDetailLater':
          'Детальная атрибуция источников появится позже.',
      'ownerBenchmarkSection': 'Сравнение с категорией',
      'ownerBenchmarkNotEnough': 'Пока недостаточно данных для сравнения',
      'ownerRecommendationsSection': 'Рекомендации',
      'ownerPackageTitle': 'Пакет',
      'ownerPackageNotFound': 'Пакет не найден',
      'ownerPackageContents': 'Состав пакета',
      'ownerPackageQuoteFailed': 'Не удалось получить стоимость пакета.',
      'ownerNoPromotionsForAds': 'Нет активных акций для продвижения.',
      'ownerOrderTitle': 'Заказ',
      'ownerOrderCreated': 'Заказ создан',
      'ownerToPay': 'К оплате:',
      'ownerRefreshStatus': 'Обновить статус',
      'ownerNoOrders': 'У вас пока нет заказов',
      'ownerOrdersLoadFailed': 'Не удалось загрузить заказы.',
      'ownerOrderNotFound': 'Заказ не найден.',
      'ownerYourOrder': 'Ваш заказ',
      'ownerAfterPayment': 'после оплаты',
      'ownerConfirmOrder': 'Подтвердить заказ',
      'ownerOrderCreateFailed': 'Не удалось создать заказ.',
      'ownerCampaignsLoadFailed': 'Не удалось загрузить продвижения.',
      'ownerNoCampaigns': 'Нет активных продвижений',
      'ownerCampaignGroupActive': 'Активные',
      'ownerCampaignGroupScheduled': 'Запланированные',
      'ownerCampaignGroupModeration': 'На модерации',
      'ownerCampaignGroupCompleted': 'Завершённые',
      'ownerCampaignGroupOther': 'Другие',
      'ownerCampaignDaysLeft': 'Осталось {days} {unit}',
      '@ownerCampaignDaysLeft': {
        'placeholders': {
          'days': {'type': 'int'},
          'unit': {'type': 'String'},
        }
      },
      'ownerCampaignMetrics':
          'Показы: {served} · Просмотры: {views} · Переходы: {clicks}',
      '@ownerCampaignMetrics': {
        'placeholders': {
          'served': {'type': 'String'},
          'views': {'type': 'String'},
          'clicks': {'type': 'String'},
        }
      },
      'ownerCampaignNotFound': 'Кампания не найдена.',
      'ownerCampaignPeriod':
          'Период: {range}',
      '@ownerCampaignPeriod': {
        'placeholders': {'range': {'type': 'String'}}
      },
      'ownerCampaignStatsFailed': 'Не удалось загрузить статистику.',
      'ownerCampaignStatsPending': 'Статистика появится после начала показов.',
      'ownerCampaignViews': 'Просмотры',
      'ownerCampaignClicks': 'Переходы',
      'ownerGotIt': 'Понятно',
      'ownerCampaignActions': 'Действия',
      'ownerVipBannerTitle': 'VIP-баннер',
      'ownerVipImageLoadFailed': 'Не удалось загрузить изображение.',
      'ownerVipTitleMinLength': 'Введите заголовок (минимум 2 символа).',
      'ownerVipSaveFailed': 'Не удалось сохранить баннер.',
      'ownerVipHeadlineLabel': 'Заголовок',
      'ownerVipHeadlineHint': 'Заголовок баннера',
      'ownerVipDescriptionOptional': 'Описание (необязательно)',
      'ownerVipButtonLabel': 'Текст кнопки',
      'ownerVipDefaultButton': 'Подробнее',
      'ownerVipUploadImage': 'Загрузить изображение',
      'ownerVipReplaceImage': 'Заменить изображение',
      'ownerHidePreview': 'Скрыть предпросмотр',
      'ownerShowPreview': 'Предпросмотр',
      'ownerContinueToOrder': 'Продолжить к заказу',
    };

Map<String, dynamic> _kk() {
  final ru = _ru();
  final overrides = <String, String>{
    'ownerPlanTierFree': 'Тегін',
    'ownerPlanTierBasic': 'Бизнес',
    'ownerPlanTierPremium': 'PRO',
    'ownerPlanTierVip': 'VIP',
    'ownerStatusActive': 'Белсенді',
    'ownerStatusPendingModeration': 'Модерацияда',
    'ownerStatusBlocked': 'Блокталған',
    'ownerPromotionStatusActive': 'Белсенді',
    'ownerPromotionStatusExpired': 'Мерзімі өткен',
    'ownerPromotionFeedHint':
        'Қала лентасындағы насихат — жарнамалық өнімдер арқылы',
    'ownerNotificationReviewNew': 'Жаңа пікір',
    'ownerNotificationReviewReply': 'Пікірге жауап',
    'ownerNotificationModeration': 'Модерация',
    'ownerNotificationPromotion': 'Акция',
    'ownerNotificationPlan': 'Тариф',
    'ownerNotificationGeneral': 'Жалпы',
    'ownerKpiViews': 'Қараулар',
    'ownerKpiCalls': 'Қоңыраулар',
    'ownerKpiRoutes': 'Бағыттар',
    'ownerKpiFavorites': 'Таңдаулылар',
    'ownerAnalyticsFavorites': 'Таңдаулыларға',
    'ownerAnalyticsDeltaPositive': 'Алдыңғы кезеңге қатысты +{percent}%',
    'ownerAnalyticsDeltaNegative': 'Алдыңғы кезеңге қатысты {percent}%',
    'ownerAnalyticsDeltaZero': 'Алдыңғы кезенге қатысты 0%',
    'ownerAnalyticsUpgradeActions': '«Бизнес» тарифінде қолжетімді',
    'ownerAnalyticsUpgradeSources':
        'Көздер, іздеу сұраулары және CTR PRO тарифінде',
    'ownerAnalyticsUpgradeAudience': 'Analytics 360 VIP тарифінде',
    'ownerPermissionProfileEdit': 'Профильді өңдеу',
    'ownerPermissionHoursEdit': 'Жұмыс уақыты',
    'ownerPermissionCatalogEdit': 'Тауарлар мен қызметтер',
    'ownerPermissionPhotosEdit': 'Фото және галерея',
    'ownerPermissionPromotionsEdit': 'Акциялар',
    'ownerPermissionReviewsReply': 'Пікірлерге жауап',
    'ownerPermissionAnalyticsView': 'Статистиканы көру',
    'ownerPermissionAnalyticsExport': 'Статистиканы экспорттау',
    'ownerPermissionAdsManage': 'Жарнама және насихат',
    'ownerPermissionPaymentsView': 'Төлемдерді көру',
    'ownerMembershipStatusActive': 'Белсенді',
    'ownerMembershipStatusSuspended': 'Уақытша тоқтатылған',
    'ownerMembershipStatusRevoked': 'Қолжетімділік алынды',
    'ownerMembershipStatusInvited': 'Шақырылған',
    'ownerPresetManager': 'Басқарушы',
    'ownerPresetManagerDesc': 'Командасыз операциялық қолжетімділік',
    'ownerPresetContent': 'Контент-менеджер',
    'ownerPresetContentDesc': 'Профиль, каталог, фото және акциялар',
    'ownerPresetMarketing': 'Маркетолог',
    'ownerPresetMarketingDesc': 'Акциялар, жарнама және базалық аналитика',
    'ownerPresetAnalytics': 'Аналитик',
    'ownerPresetAnalyticsDesc': 'Статистиканы көру және экспорт',
    'ownerPermissionsMore': '{head} · +{count}',
    'monetizationProductBoost': 'Картаны көтеру',
    'monetizationProductTopCategory': 'TOP санаты',
    'monetizationProductPromotedPromotion': 'Акцияны насихаттау',
    'monetizationProductFeaturedBusiness': 'Танымал орын',
    'monetizationProductVipBanner': 'VIP-бanner',
    'monetizationProductBoostDesc':
        'Санатыңызда бизнесіңіздің қосымша көрінуі.',
    'monetizationProductTopCategoryDesc':
        'Бизнесіңіз санатыңыздың басым жарнама блогында көрсетіледі.',
    'monetizationProductPromotedPromotionDesc':
        'Акцияңыз QalaGo-да қосымша жарнамалық орын алады.',
    'monetizationProductFeaturedBusinessDesc':
        'Бизнесіңіз басты бетте қосымша орын алады.',
    'monetizationProductVipBannerDesc':
        'QalaGo басты бетіндегі үлкен жарнамалық banner.',
    'monetizationProductDefaultDesc': 'QalaGo-дағы жарнамалық орналасу.',
    'monetizationProductTopCategoryNote':
        'Орындар белсенді жарнамадатулар арасында автоматты бөлінеді.',
    'monetizationOrderAwaitingPayment': 'Төлем күтілуде',
    'monetizationOrderPaid': 'Төленген',
    'monetizationOrderRefunded': 'Қайтару',
    'monetizationOrderPartialRefund': 'Ішінара қайтару',
    'monetizationCampaignPendingModeration': 'Модерацияда',
    'monetizationCampaignScheduled': 'Жоспарланған',
    'monetizationCampaignPaused': 'Уақытша тоқтатылған',
    'monetizationCampaignCompleted': 'Аяқталған',
    'monetizationCreativePending': 'Тексеруде',
    'monetizationCreativeApproved': 'Мақұлданған',
    'monetizationAnalyticsCardOpen': 'Карта ашулары',
    'monetizationAnalyticsPromotionOpen': 'Акция ашулары',
    'monetizationPurchaseAvailable': 'Қолжетімді',
    'monetizationPurchaseActive': 'Белсенді',
    'monetizationPurchaseSoldOut': 'Орын жоқ',
    'monetizationActionBuy': 'Сатып алу',
    'monetizationActionContinuePayment': 'Төлемді жалғастыру',
    'monetizationActionRenew': 'Ұзарту',
    'monetizationReasonPendingOrder':
        'Бұл орналасуға төленбеген тапсырысыңыз бар.',
    'monetizationReasonConflict': 'Орналасу ағымдағы кестемен сәйкес келмейді.',
    'monetizationReasonAlreadyActive': 'Орналасу қазірдің өзінде белсенді.',
    'monetizationReasonAlreadyScheduled': 'Орналасу қазірдің өзінде жоспарланған.',
    'monetizationReasonTargetPromoted': 'Бұл акция қазірдің өзінде насихатталады.',
    'monetizationReasonCategoryIneligible':
        'Санат бұл өнімге сай емес.',
    'monetizationReasonPromotionIneligible': 'Акция насихатқа жарамсыз.',
    'monetizationReasonSoldOut': 'Таңдалған кезеңде бос орын жоқ.',
    'monetizationReasonPackageConflict':
        'Пакет компоненттері бос слоттарға сыймайды.',
    'monetizationReasonReservationExpired':
        'Орын резерві мерзімі өтті — статусты жаңартып, қайта көріңіз.',
    'monetizationReasonGeneric': 'Әрекет орындалмады.',
    'monetizationReasonGenericWithCode': 'Әрекет орындалмады ({code}).',
    'monetizationVipModerationNotice':
        'VIP-banner модерациядан кейін жарияланады. Төленген кезең banner мақұлданғаннан кейін ғана басталады.',
    'monetizationPackageVipNotice':
        'Пакетке VIP-banner кіреді. VIP орналасуын іске қосу үшін bannerді баптап, модерациядан өту керек.',
    'monetizationPackageVipCta': 'VIP-bannerді баптау',
    'monetizationPaymentInfoNotice':
        'Төлем расталғаннан кейін насихат автоматты түрде іске қосылады.',
    'monetizationPaymentMethodUnavailable':
        'Төлем әдісі төлем сервисі қосылғаннан кейін қолжетімді болады.',
    'monetizationCtrTooltip':
        'CTR — жарнама көріністерінен өтулердің үлесі.',
    'ownerInvitationStatusPending': 'Шақыру белсенді',
    'ownerInvitationStatusAccepted': 'Шақыру қабылданған',
    'ownerInvitationStatusRevoked': 'Шақыру кері алынған',
    'ownerInvitationStatusExpired': 'Шақыру мерзімі өткен',
    'ownerDurationDays': '{count} {unit}',
    'ownerDurationHours': '{count} сағ',
    'ownerDayUnitOne': 'күн',
    'ownerDayUnitFew': 'күн',
    'ownerDayUnitMany': 'күн',
    'ownerNavOverview': 'Шолу',
    'ownerNavAnalytics': 'Статистика',
    'ownerNavPromote': 'Жарнама және насихат',
    'ownerNavMessages': 'Хабарламалар',
    'ownerNavPlan': 'Тариф',
    'ownerNavTeam': 'Команда',
    'ownerNavSettings': 'Баптаулар',
    'ownerNavHelp': 'Көмек',
    'ownerNavBackToApp': 'QalaGo қосымшасына',
    'ownerBusinessDrawerTitle': 'QalaGo Business',
    'ownerDashboardTitle': 'Бизнес кабинеті',
    'ownerAddBusiness': 'Қосу',
    'ownerBusinessLabel': 'Мекеме',
    'ownerWelcome': 'Қош келдіңіз, {title}!',
    'ownerNoBusinessesTitle': 'Мекемелер жоқ',
    'ownerNoBusinessesBody':
        'Мекемені тіркеңіз — модерациядан кейін QalaGo-да пайда болады.',
    'ownerRegisterBusiness': 'Мекемені тіркеу',
    'ownerSummaryWeek': '7 күнде {views} қарау · {actions} әрекет',
    'ownerDeltaWeek': 'апта: {delta}',
    'ownerViewsChartTitle': '7 күндегі қараулар',
    'ownerTrendsLockedHint':
        'Күн бойынша әрекет графигі «Бизнес» тарифі және жоғарысында.',
    'ownerPlanUsageTitle': 'Тарифті пайдалану',
    'ownerProfileCard': 'Профиль',
    'ownerProfileCompletion': '{percent}% толтырылған',
    'ownerFillProfile': 'Толтыру',
    'ownerUpgradePlan': 'Жақсарту',
    'ownerActivePromotions': 'Белсенді акциялар',
    'ownerNoActivePromotions': 'Белсенді акциялар жоқ',
    'ownerPromoteCatalogSubtitle':
        'VIP-banner, TOP санаттары, акция насихаты және пакеттер',
    'ownerOpenCatalog': 'Каталогты ашу',
    'ownerMyCampaigns': 'Науқандарым',
    'ownerManagementSection': 'Басқару',
    'ownerPreviewCard': 'Картаны алдын ала көру',
    'ownerMgmtMyBusiness': 'Менің бизнесім',
    'ownerMgmtGallery': 'Галерея',
    'ownerMgmtPromotions': 'Акциялар',
    'ownerMgmtReviews': 'Пікірлер',
    'ownerErrorWithDetails': 'Қате: {details}',
    'ownerSaving': 'Сақталуда…',
    'ownerSubmitting': 'Жіберілуде…',
    'ownerConfirm': 'Растау',
    'ownerRevoke': 'Кері алу',
    'ownerDefaultBusiness': 'Мекеме',
    'ownerDefaultMember': 'Қатысушы',
    'ownerDefaultManager': 'Менеджер',
    'ownerDefaultUser': 'Пайдаланушы',
    'ownerTeamNoAccessTitle': 'Қолжетімділік жоқ',
    'ownerTeamNoAccessBody':
        'Команданы тек мекеме иесі басқара алады.',
    'ownerGoHome': 'Басты бетке',
    'ownerInvite': 'Шақыру',
    'ownerTeamMembers': 'Қатысушылар',
    'ownerTeamNoMembers': 'Қатысушылар жоқ',
    'ownerTeamPendingInvites': 'Күтілген шақырулар',
    'ownerTeamNoPendingInvites': 'Күтілген шақырулар жоқ',
    'ownerTeamPlanNoManagers': 'Тариф менеджерлерді қамтамасыз етпейді.',
    'ownerTeamManagerLimit': 'Тарифіңіздегі менеджер лимиті толды.',
    'ownerViewPlans': 'Тарифтерді көру',
    'ownerTeamManagersUnavailable': 'Ағымдағы тарифте менеджерлер жоқ',
    'ownerTeamManagersUsage': 'Менеджерлер: {used} / {limit}',
    'ownerTeamManagersExtra': ' ({active} белсенді · {pending} күтуде)',
    'ownerSuspendManagerTitle': 'Менеджер қолжетімділігін уақытша тоқтату керек пе?',
    'ownerSuspendManagerBody':
        'Менеджер бизнесді басқаруға уақытша қол жеткізе алмайды.',
    'ownerAccessSuspended': 'Қолжетімділік тоқтатылды',
    'ownerAccessRestored': 'Қолжетімділік қалпына келтірілді',
    'ownerRevokeManagerTitle': 'Менеджер қолжетімділігін алу керек пе?',
    'ownerRevokeManagerBody':
        'Менеджер бұл бизнесті енді басқара алмайды.',
    'ownerAccessRevoked': 'Қолжетімділік алынды',
    'ownerEditPermissions': 'Қолжетімділікті өзгерту',
    'ownerSuspend': 'Тоқтату',
    'ownerRemoveAccess': 'Қолжетімділікті алу',
    'ownerRestore': 'Қалпына келтіру',
    'ownerRevokeInviteTitle': 'Шақыруды кері алу керек пе?',
    'ownerRevokeInviteBody': '{email} шақыруын кері алу керек пе?',
    'ownerInviteRevoked': 'Шақыру кері алынды',
    'ownerInviteStatusLine': '{status} · {expires} дейін',
    'ownerInvalidEmail': 'Дұрыс email енгізіңіз',
    'ownerSelectPermission': 'Кем дегенде бір рұқсат таңдаңыз',
    'ownerInviteCreated': 'Шақыру жасалды',
    'ownerManagerAdded': 'Менеджер командаға қосылды',
    'ownerInviteManagerTitle': 'Менеджерді шақыру',
    'ownerInviteManagerBody':
        'Email және рұқсаттарды көрсетіңіз. Жасалғаннан кейін сілтемені менеджерге жіберіңіз.',
    'ownerAccessPermissions': 'Қолжетімділік рұқсаттары',
    'ownerInviteLinkHint':
        'Бұл сілтемені менеджерге жіберіңіз. Ол бір реттік және шектеулі уақытқа жарамды.',
    'ownerLinkCopied': 'Сілтеме көшірілді',
    'ownerCopyLink': 'Сілтемені көшіру',
    'ownerSendInvite': 'Шақыру жіберу',
    'ownerPermissionsUpdated': 'Рұқсаттар жаңартылды',
    'ownerManagerPermissionsTitle': 'Менеджер рұқсаттары',
    'ownerMonetizationTitle': 'Жарнама және насихат',
    'ownerSelectBusinessFirst': 'Алдымен мекемені таңдаңыз',
    'ownerChoosePromotionMethod': 'Насихат тәсілін таңдаңыз',
    'ownerPriceLoadFailed': 'Бағалар алынбады. Қосылуды тексеріңіз.',
    'ownerProductsUnavailable': 'Жарнамалық өнімдер уақытша қолжетімсіз.',
    'ownerReadyPackages': 'Дайын пакеттер',
    'ownerPackagesLoadFailed': 'Пакеттер жүктелмedi.',
    'ownerMyPromotions': 'Насихаттарым',
    'ownerMyOrders': 'Тапсырыстарым',
    'ownerProductTitle': 'Өнім',
    'ownerBusinessNotSelected': 'Мекеме таңдалмаған',
    'ownerPriceFailedShort': 'Бағалар алынбады.',
    'ownerProductNotFound': 'Өнім табылмады',
    'ownerPeriodLabel': 'Кезең',
    'ownerStartLabel': 'Басталуы',
    'ownerStartAfterPayment': 'Төлемнен кейін бірден',
    'ownerPickDate': 'Күн таңдау',
    'ownerSelectDate': 'Күнді таңдаңыз',
    'ownerDiscountPercent': 'Жеңілдік {percent}%',
    'ownerGetQuote': 'Құнын алу',
    'ownerQuoteFailed': 'Құны алынбады.',
    'ownerPromotionsLoadFailed': 'Акциялар жүктелмedi.',
    'ownerCreatePromotionFirst': 'Алдымен белсенді акция жасаңыз.',
    'ownerCreatePromotion': 'Акция жасау',
    'ownerSelectPromotion': 'Акция таңдаңыз',
    'ownerActiveUntil': '{date} дейін белсенді',
    'ownerNextAvailableDate': 'Ең жақын қолжетімді күн: {date}',
    'ownerReservedUntil': 'Орын {date} дейін резервтелген',
    'ownerPriceFrom': '{price} бастап',
    'ownerCostLabel': 'Құны',
    'ownerTotalLabel': 'Барлығы',
    'ownerSlotsOccupied': 'Таңдалған кезеңде жарнама орындары бос емес.',
    'ownerSettingsTitle': 'Баптаулар',
    'ownerAccountSection': 'Аккаунт',
    'ownerPhoneLabel': 'Телефон',
    'ownerPhoneMissing': 'Телефон көрсетілмеген',
    'ownerDisplayNameLabel': 'Иесінің аты',
    'ownerDisplayNameHint': 'Кабинетте қалай көрсетіледі',
    'ownerNameSaved': 'Аты сақталды',
    'ownerBusinessSection': 'Мекеме',
    'ownerBusinessSettingsHint':
        'Картаны, уақытты және байланысты профильде өңдеңіз.',
    'ownerGallery': 'Галерея',
    'ownerNoBusinessApply': 'Мекеме жоқ — модерацияға өтінім беріңіз.',
    'ownerRegister': 'Тіркеу',
    'ownerSecuritySection': 'Қауіпсіздік',
    'ownerSecurityHint':
        'SMS-код арқылы кіру. Номерді ауыстыру үшін қолдауға хабарласыңыз.',
    'ownerReviewReplySaved': 'Жауап сақталды',
    'ownerReviewsTitle': 'Пікірлер · {title}',
    'ownerNoReviews': 'Пікірлер әлі жоқ',
    'ownerReviewsSummary': '{total} пікір{unanswered}',
    'ownerReviewsUnansweredSuffix': ' · {count} жауапсыз',
    'ownerYourReply': 'Сіздің жауабыңыз: {reply}',
    'ownerReplyLabel': 'Иесінің жауабы',
    'ownerReplyAction': 'Жауап беру',
    'ownerUpdateReply': 'Жаңарту',
    'ownerPromotionLimit': 'Белсенді акция лимиті: {max}. Тарифті жақсартыңыз.',
    'ownerNewPromotion': 'Жаңа акция',
    'ownerEditPromotion': 'Акцияны өңдеу',
    'ownerFieldTitle': 'Атауы',
    'ownerFieldDiscount': 'Жеңілдік',
    'ownerFieldDescription': 'Сипаттама',
    'ownerFieldStatus': 'Күйі',
    'ownerPromotionStatusCompleted': 'Аяқталған',
    'ownerCreate': 'Жасау',
    'ownerPromotionCreated': 'Акция жасалды',
    'ownerPromotionUpdated': 'Акция жаңартылды',
    'ownerDeletePromotionTitle': 'Акцияны жою керек пе?',
    'ownerDeletePromotionBody': '«{title}» қалпына келмей жойылады.',
    'ownerPromotionDeleted': 'Акция жойылды',
    'ownerPromotionsTitle': 'Акциялар · {title}',
    'ownerNoPromotions': 'Акциялар әлі жоқ',
    'ownerNoPromotionsHint': 'Қонақтар тарту үшін алғашқы акцияны жасаңыз',
    'ownerActivePromotionsCount': 'Белсенді: {active} / {max}',
    'ownerEdit': 'Өңдеу',
    'ownerPlanTitle': 'Тариф',
    'ownerRegisterBusinessFirst': 'Алдымен мекемені тіркеңіз',
    'ownerPlanUpdated': 'Тариф жаңартылды',
    'ownerPlanCurrent': 'Ағымдағы: {name}',
    'ownerPlanPromoteSubtitle': 'TOP, VIP-banner, пакеттер және статистика',
    'ownerPlanPeriodMonth': 'ай',
    'ownerPlanPeriodDays': '{days} күн',
    'ownerMenuEmpty': 'Мәзірде позициялар әлі жоқ',
    'ownerMenuOtherGroup': 'Басқа',
    'ownerTeamForbidden': 'Бұл әрекетке рұқсатыңыз жоқ.',
    'ownerTeamNotFound': 'Жазба табылмады.',
    'ownerTeamActionFailed': 'Әрекет орындалмады. Кейінірек қайталап көріңіз.',
    'ownerInviteNotFound': 'Шақыру табылмады немесе сілтеме жарамсыз.',
    'ownerAcceptingInvite': 'Қабылдануда…',
    'ownerAcceptInvite': 'Шақыруды қабылдау',
    'ownerGalleryTitle': 'Галерея · {title}',
    'ownerPhotoLimitSnackbar':
        'Тариф лимиті: {max} фотоға дейін. «Тариф» бөлімінде тарифті жақсартыңыз.',
    'ownerCoverUpdated': 'Мұқаба жаңартылды',
    'ownerPhotoAdded': 'Фото қосылды',
    'ownerUploadError': 'Жүктеу қатесі: {details}',
    'ownerPhotosUsage': 'Фото: {used} / {max}{suffix}',
    'ownerPhotoLimitReached': ' · лимит толды',
    'ownerGalleryEmpty': 'Галерея бос',
    'ownerGalleryEmptyHint': 'Интерьер, тағам немесе қызмет фотосын қосыңыз',
    'ownerCoverLabel': 'Мұқаба',
    'ownerSetCover': 'Мұқаба ретінде орнату',
    'ownerPhotoLabel': 'Фото',
    'ownerEditProfileTitle': 'Мекеме профилі',
    'ownerFieldShortDesc': 'Қысқа сипаттама',
    'ownerFieldFullDesc': 'Толық сипаттама',
    'ownerContactsSection': 'Байланыс',
    'ownerWorkHoursSection': 'Жұмыс уақыты',
    'ownerWorkHoursFormat': 'Формат: 09:00-22:00',
    'ownerWorkHoursWeekdays': 'Дс–Жм',
    'ownerWorkHoursSaturday': 'Сенбі',
    'ownerWorkHoursSunday': 'Жексенбі',
    'ownerRequiredNameAddress': 'Атау мен мекенжайды толтырыңыз',
    'ownerProfileSaved': 'Мекеме профилі сақталды',
    'ownerAnalyticsTitle': 'Статистика',
    'ownerAnalyticsAds': 'Жарнама',
    'ownerAnalyticsLoadFailed':
        'Статистика жүктелмedi. Желі мен қайталап көріңіз.',
    'ownerAnalyticsPeriodDays': '{days} күн',
    'ownerAnalyticsOverview': 'Шолу',
    'ownerAnalyticsTargetActions': 'Мақсатты әрекеттер',
    'ownerAnalyticsAdsStats': 'Жарнама статистикасы',
    'ownerAnalyticsAcquisition': 'Тартулар',
    'ownerAnalyticsSourcesPro': 'Көздер PRO тарифінде',
    'ownerAnalyticsSourcesEmpty': 'Көздер',
    'ownerAnalyticsNotEnoughData': 'Деректер жеткіліксіз',
    'ownerAnalyticsSearchQueries': 'Пайдаланушылар не іздейді',
    'ownerAnalyticsSearchEmpty': 'Іздеу сұрауларын талдауға деректер жеткіліксіз',
    'ownerAnalyticsSearchPro': 'Іздеу сұраулары PRO тарифінде',
    'ownerExportFailed': 'Есеп дайындалмады. Қайталап көріңіз.',
    'ownerExportForbidden': 'Экспорт рөл немесе тарифке қолжетімсіз.',
    'ownerExportCsv': 'CSV экспорт',
    'ownerExportPreparing': 'Дайындалуда…',
    'ownerSearchOtherQueries': 'Басқа сұраулар — {count}',
    'ownerSearchTransitions': '{count} өту',
    'ownerSourcesDetailLater': 'Көздердің егжей-тегжейлі атрибуциясы кейінірек.',
    'ownerBenchmarkSection': 'Санатпен салыстыру',
    'ownerBenchmarkNotEnough': 'Салыстыруға деректер әлі жеткіліксіз',
    'ownerRecommendationsSection': 'Ұсыныстар',
    'ownerPackageTitle': 'Пакет',
    'ownerPackageNotFound': 'Пакет табылмады',
    'ownerPackageContents': 'Пакет құрамы',
    'ownerPackageQuoteFailed': 'Пакет құны алынбады.',
    'ownerNoPromotionsForAds': 'Насихатқа белсенді акциялар жоқ.',
    'ownerOrderTitle': 'Тапсырыс',
    'ownerOrderCreated': 'Тапсырыс жасалды',
    'ownerToPay': 'Төлеуге:',
    'ownerRefreshStatus': 'Статусты жаңарту',
    'ownerNoOrders': 'Тапсырыстарыңыз әлі жоқ',
    'ownerOrdersLoadFailed': 'Тапсырыстар жүктелмedi.',
    'ownerOrderNotFound': 'Тапсырыс табылмады.',
    'ownerYourOrder': 'Сіздің тапсырысыңыз',
    'ownerAfterPayment': 'төлемнен кейін',
    'ownerConfirmOrder': 'Тапсырысты растау',
    'ownerOrderCreateFailed': 'Тапсырыс жасалмады.',
    'ownerCampaignsLoadFailed': 'Насихаттар жүктелмedi.',
    'ownerNoCampaigns': 'Белсенді насихаттар жоқ',
    'ownerCampaignGroupActive': 'Белсенді',
    'ownerCampaignGroupScheduled': 'Жоспарланған',
    'ownerCampaignGroupModeration': 'Модерацияда',
    'ownerCampaignGroupCompleted': 'Аяқталған',
    'ownerCampaignGroupOther': 'Басқалар',
    'ownerCampaignDaysLeft': '{days} {unit} қалды',
    'ownerCampaignMetrics':
        'Көрсетулер: {served} · Қараулар: {views} · Өтулер: {clicks}',
    'ownerCampaignNotFound': 'Науқан табылмады.',
    'ownerCampaignPeriod': 'Кезең: {range}',
    'ownerCampaignStatsFailed': 'Статистика жүктелмedi.',
    'ownerCampaignStatsPending': 'Көрсетулер басталғаннан кейін статистика пайда болады.',
    'ownerCampaignViews': 'Қараулар',
    'ownerCampaignClicks': 'Өтулер',
    'ownerGotIt': 'Түсінікті',
    'ownerCampaignActions': 'Әрекеттер',
    'ownerVipBannerTitle': 'VIP-banner',
    'ownerVipImageLoadFailed': 'Сурет жүктелмedi.',
    'ownerVipTitleMinLength': 'Тақырып енгізіңіз (кемінде 2 таңба).',
    'ownerVipSaveFailed': 'Banner сақталмады.',
    'ownerVipHeadlineLabel': 'Тақырып',
    'ownerVipHeadlineHint': 'Banner тақырыбы',
    'ownerVipDescriptionOptional': 'Сипаттама (міндетті емес)',
    'ownerVipButtonLabel': 'Батырма мәтіні',
    'ownerVipDefaultButton': 'Толығырақ',
    'ownerVipUploadImage': 'Сурет жүктеу',
    'ownerVipReplaceImage': 'Суретті ауыстыру',
    'ownerHidePreview': 'Алдын ала көруді жасыру',
    'ownerShowPreview': 'Алдын ала көру',
    'ownerContinueToOrder': 'Тапсырысқа өту',
  };

  final out = <String, dynamic>{};
  for (final entry in ru.entries) {
    if (entry.key.startsWith('@')) {
      out[entry.key] = entry.value;
      continue;
    }
    if (overrides.containsKey(entry.key)) {
      out[entry.key] = overrides[entry.key]!;
    } else if (entry.value is String) {
      out[entry.key] = entry.value;
    } else {
      out[entry.key] = entry.value;
    }
  }
  // Re-add @ metadata from ru for placeholders
  for (final entry in ru.entries) {
    if (entry.key.startsWith('@')) {
      out[entry.key] = entry.value;
    }
  }
  return out;
}
