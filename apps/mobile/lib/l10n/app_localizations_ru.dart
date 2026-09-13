// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get appTitle => 'QalaGo';

  @override
  String get navHome => 'Главная';

  @override
  String get navCategories => 'Категории';

  @override
  String get navMap => 'Карта';

  @override
  String get navFavorites => 'Избранное';

  @override
  String get navProfile => 'Профиль';

  @override
  String get commonRetry => 'Повторить';

  @override
  String get commonCancel => 'Отмена';

  @override
  String get commonSave => 'Сохранить';

  @override
  String get commonBack => 'Назад';

  @override
  String get commonDone => 'Готово';

  @override
  String get commonMore => 'Ещё';

  @override
  String get commonTryAgain => 'Попробовать снова';

  @override
  String get commonSomethingWrong => 'Что-то пошло не так';

  @override
  String get commonNoData => 'Нет данных';

  @override
  String get commonContinue => 'Продолжить';

  @override
  String get commonDelete => 'Удалить';

  @override
  String get commonLogin => 'Войти';

  @override
  String get commonReset => 'Сбросить';

  @override
  String get commonAll => 'Все';

  @override
  String get commonAllCategories => 'Все категории';

  @override
  String get commonAd => 'Реклама';

  @override
  String get commonViewAll => 'Смотреть все';

  @override
  String get homeSearchPlaceholder => 'Поиск заведений и услуг...';

  @override
  String get homeCategoriesEmpty => 'Категории пока не добавлены';

  @override
  String get homePromotionsEmpty => 'Нет активных акций';

  @override
  String get homePopularEmpty => 'Нет популярных заведений';

  @override
  String get homePromotionsSection => 'Акции и предложения';

  @override
  String get homeNearbySection => 'Рядом с вами';

  @override
  String get homeRecommendedSection => 'Рекомендуем';

  @override
  String get homeNearbySubtitle => 'Места рядом с вами · до 3 км';

  @override
  String get homeNearbyEmpty => 'В радиусе 3 км от вас пока нет заведений';

  @override
  String get homeNotificationsTooltip => 'Уведомления';

  @override
  String get homeFeaturedPrevTooltip => 'Предыдущее заведение';

  @override
  String get homeFeaturedNextTooltip => 'Следующее заведение';

  @override
  String get homeCategoryMoreSemantics => 'Ещё категории';

  @override
  String get homeCategoriesSection => 'Категории';

  @override
  String get categoriesTitle => 'Категории';

  @override
  String get categoriesFilterHint => 'Фильтр по названию категории...';

  @override
  String get categoriesSearchBusinesses => 'Поиск заведений';

  @override
  String get categoriesNotFound => 'Категории не найдены';

  @override
  String get categoriesSort => 'Сортировка';

  @override
  String get categoryRecommended => 'Рекомендуемые';

  @override
  String get categoryNearest => 'Ближе к вам';

  @override
  String get categoryByRating => 'По рейтингу';

  @override
  String get categoryPopular => 'Популярные';

  @override
  String get categoryEmpty => 'В этой категории пока нет мест';

  @override
  String get categorySubEmpty => 'В этой подкатегории пока нет мест';

  @override
  String get categoryNearestNeedsLocation =>
      'Разрешите доступ к геопозиции, чтобы показать ближайшие места';

  @override
  String get categorySponsored => 'Продвигаемые места';

  @override
  String get categoryAllPlaces => 'Все места';

  @override
  String get searchPlaceholder => 'Поиск заведений и услуг...';

  @override
  String get searchResetFilters => 'Сбросить фильтры';

  @override
  String get searchNoResults => 'Ничего не найдено';

  @override
  String get searchClearTooltip => 'Очистить';

  @override
  String get searchFailed => 'Не удалось выполнить поиск.';

  @override
  String get searchEnterQuery => 'Введите название или выберите категорию';

  @override
  String searchFoundCount(int count) {
    return 'Найдено: $count';
  }

  @override
  String searchNoResultsQueryCategory(String query) {
    return 'Ничего не найдено по запросу «$query» в выбранной категории';
  }

  @override
  String searchNoResultsQueryCity(String query, String cityName) {
    return 'Ничего не найдено по запросу «$query» в $cityName';
  }

  @override
  String searchNoInCategoryRadius(String radiusLabel) {
    return 'Нет заведений в выбранной категории $radiusLabel';
  }

  @override
  String get searchNoInCategory => 'Нет заведений в выбранной категории';

  @override
  String get searchRadiusWholeCity => 'Весь город';

  @override
  String searchRadiusKm(int km) {
    return 'до $km км';
  }

  @override
  String get favoritesTitle => 'Избранное';

  @override
  String get favoritesEmpty => 'Здесь будут ваши избранные места';

  @override
  String get favoritesGuestTitle => 'Войдите, чтобы сохранять избранное';

  @override
  String get favoritesGuestBody =>
      'Добавляйте места в избранное и возвращайтесь к ним в один тап.';

  @override
  String get favoritesRecent => 'Недавние';

  @override
  String get favoritesByName => 'По названию';

  @override
  String get favoritesSortLabel => 'Сортировка:';

  @override
  String searchRadiusKmExact(int km) {
    return '$km км';
  }

  @override
  String get mapTitle => 'Карта';

  @override
  String get mapNoBusinessesNearby => 'Рядом нет заведений';

  @override
  String get mapEnableLocation => 'Включить геолокацию';

  @override
  String get mapLoadFailed => 'Не удалось загрузить заведения на карте';

  @override
  String get mapCloseTooltip => 'Закрыть';

  @override
  String get mapDetails => 'Подробнее';

  @override
  String get mapBusinessesOnMap => 'Заведения на карте';

  @override
  String get mapNoCoordinates => 'Нет заведений с координатами';

  @override
  String get profileTitle => 'Профиль';

  @override
  String get profileLanguageApplyHint => 'Смена языка применяется сразу.';

  @override
  String get profileLanguage => 'Язык';

  @override
  String get profileLanguageRu => 'Русский';

  @override
  String get profileLanguageKk => 'Қазақша';

  @override
  String get profilePersonalData => 'Личные данные';

  @override
  String get profileMyCity => 'Мой город';

  @override
  String get profileMyReviews => 'Мои отзывы';

  @override
  String get profileNotifications => 'Уведомления';

  @override
  String get profilePermissions => 'Мои права';

  @override
  String get profileHelp => 'Помощь';

  @override
  String get profileAbout => 'О приложении';

  @override
  String get profileForBusiness => 'Для бизнеса';

  @override
  String get profileFindBusiness => 'Найти свой бизнес';

  @override
  String get profileFindBusinessSubtitle => 'Если карточка уже есть в QalaGo';

  @override
  String get profileAddBusiness => 'Добавить бизнес';

  @override
  String get profileAddBusinessSubtitle => 'Создать новую заявку на добавление';

  @override
  String get profileMyBusinesses => 'Мои бизнесы';

  @override
  String get profileMyBusinessesSubtitle => 'Кабинет и управление';

  @override
  String get profileAddMoreBusiness => 'Добавить ещё бизнес';

  @override
  String get profileFindExistingBusiness => 'Найти существующий бизнес';

  @override
  String get profileFindExistingSubtitle => 'Подтвердить права владельца';

  @override
  String get profileMyApplications => 'Мои заявки';

  @override
  String get profileMyApplicationsSubtitle => 'Статус заявок и подтверждений';

  @override
  String get profileModeration => 'Модерация';

  @override
  String get profileModerationSubtitle =>
      'Проверка заявок и статусов заведений';

  @override
  String get profileBusinessDefault => 'Бизнес';

  @override
  String get profileLogout => 'Выйти';

  @override
  String get profileSignOut => 'Выйти из аккаунта';

  @override
  String get profileGuestTitle => 'Войдите в аккаунт';

  @override
  String get profileGuestSubtitle => 'Сохраняйте избранное и оставляйте отзывы';

  @override
  String get profileGuestBody =>
      'Сохраняйте избранное, оставляйте отзывы и используйте персональные функции.';

  @override
  String profileCityLabel(String name) {
    return 'Город: $name';
  }

  @override
  String get profileDefaultUser => 'Пользователь';

  @override
  String get profilePhoneMissing => 'Телефон не указан';

  @override
  String get authLoginTitle => 'Вход';

  @override
  String get authPhoneHint => 'Номер телефона';

  @override
  String get authCodeHint => 'Код из SMS';

  @override
  String get authSendCode => 'Получить код';

  @override
  String get authVerify => 'Войти';

  @override
  String get authResendCode => 'Отправить код снова';

  @override
  String authResendIn(int seconds) {
    return 'Повтор через $seconds с';
  }

  @override
  String get authContinueWithGoogle => 'Войти через Google';

  @override
  String get authContinueWithApple => 'Войти через Apple';

  @override
  String get authGuestContinue => 'Продолжить без входа';

  @override
  String get authLoginHeading => 'Вход в QalaGo';

  @override
  String get authLoginSubtitle =>
      'Войдите, чтобы сохранять избранное, оставлять отзывы и управлять профилем.';

  @override
  String get authOrDivider => 'или';

  @override
  String get authLoginByPhone => 'Войти по телефону';

  @override
  String get authChangePhone => 'Изменить номер';

  @override
  String get authPhoneInvalid => 'Проверьте номер телефона';

  @override
  String get authEnterSmsCode => 'Введите код из SMS';

  @override
  String get authCodeSentAgain => 'Код отправлен повторно';

  @override
  String authCodeSentTo(String phone) {
    return 'Код отправлен на $phone';
  }

  @override
  String get authDevLogin => 'Войти без SMS (dev)';

  @override
  String get authOtpUnavailableBody =>
      'Вход через аккаунт временно недоступен в этой сборке. Можно продолжить как гость.';

  @override
  String get authDevOtpHint =>
      'Локальная разработка: OTP может приходить через backend debug.';

  @override
  String get authContinueWithoutAccount => 'Продолжить без аккаунта';

  @override
  String get businessCall => 'Позвонить';

  @override
  String get businessGenericName => 'Заведение';

  @override
  String get businessLoginTitle => 'Войдите в QalaGo';

  @override
  String get businessLoginFavoriteMessage =>
      'Чтобы сохранять избранное, войдите по номеру телефона.';

  @override
  String get businessLoginReviewMessage =>
      'Чтобы оставить отзыв, войдите по номеру телефона.';

  @override
  String get businessReviewSent => 'Отзыв отправлен';

  @override
  String get businessAbout => 'О заведении';

  @override
  String businessAllPromotions(int count) {
    return 'Все акции ($count)';
  }

  @override
  String get businessProductsServices => 'Товары и услуги';

  @override
  String businessViewAllCount(int count) {
    return 'Смотреть все ($count)';
  }

  @override
  String get businessPhotos => 'Фотографии';

  @override
  String businessAllPhotos(int count) {
    return 'Все фото ($count)';
  }

  @override
  String get businessNoReviewsYet => 'Пока нет отзывов';

  @override
  String get businessNotFound => 'Заведение не найдено или недоступно';

  @override
  String get businessLoadFailed =>
      'Не удалось загрузить информацию о заведении';

  @override
  String get businessNoReviewsShort => 'Нет отзывов';

  @override
  String get businessSchedule => 'График работы';

  @override
  String get businessContacts => 'Контакты';

  @override
  String get businessOnMap => 'На карте';

  @override
  String get businessBuildRoute => 'Построить маршрут';

  @override
  String get businessEdit => 'Редактировать';

  @override
  String get businessPromotionDefault => 'Акция';

  @override
  String businessPromotionValidUntil(String date) {
    return 'до $date';
  }

  @override
  String get catalogSearchHint => 'Найти товар или услугу';

  @override
  String get catalogPriceOnRequest => 'Цена по запросу';

  @override
  String get catalogShowMore => 'Показать ещё';

  @override
  String photosTotal(int count) {
    return 'Всего: $count';
  }

  @override
  String get photosEmpty => 'Нет фотографий';

  @override
  String get reviewWriteRequired => 'Напишите текст отзыва';

  @override
  String get reviewCheckTitle => 'Проверьте отзыв';

  @override
  String get reviewCheckBody =>
      'Текст может нарушать правила площадки. Отредактируйте отзыв или отправьте как есть — модератор проверит вручную.';

  @override
  String get reviewEdit => 'Редактировать';

  @override
  String get reviewSubmit => 'Отправить';

  @override
  String get reviewRatingLabel => 'Оценка';

  @override
  String get reviewYourReviewLabel => 'Ваш отзыв';

  @override
  String get reviewLeaveButton => 'Оставить отзыв';

  @override
  String get reviewLooksOk => 'Отзыв выглядит нормально';

  @override
  String get reviewPossibleViolations => 'Возможные нарушения';

  @override
  String get reviewRecommendCheck => 'Рекомендуем проверить текст';

  @override
  String reviewQualityScore(int score) {
    return 'Оценка качества: $score/100';
  }

  @override
  String get reviewLoginToLeave => 'Войдите, чтобы оставить отзыв';

  @override
  String get reviewLoginRequiredBody =>
      'Отзывы доступны авторизованным пользователям.';

  @override
  String get notificationsTitle => 'Уведомления';

  @override
  String get notificationsMarkAllRead => 'Прочитать все';

  @override
  String get notificationsEmpty => 'Нет уведомлений';

  @override
  String get cityNotFound => 'Города не найдены';

  @override
  String citySelectedSnack(String name) {
    return 'Город: $name';
  }

  @override
  String get onboardingFindBusinessTitle => 'Найти свой бизнес';

  @override
  String get onboardingNotFound => 'Не нашли свой бизнес?';

  @override
  String get onboardingAddNew => 'Добавить новый бизнес';

  @override
  String get onboardingConfirmRights => 'Подтвердить права';

  @override
  String get onboardingAddBusinessTitle => 'Добавить новый бизнес';

  @override
  String onboardingRejectionReason(String reason) {
    return 'Причина отклонения: $reason';
  }

  @override
  String get onboardingOpenCabinet => 'Открыть кабинет';

  @override
  String get onboardingDraftSaved => 'Черновик сохранён';

  @override
  String get businessRoute => 'Маршрут';

  @override
  String get businessWebsite => 'Сайт';

  @override
  String get businessShare => 'Поделиться';

  @override
  String get businessReviews => 'Отзывы';

  @override
  String get businessWriteReview => 'Написать отзыв';

  @override
  String get businessOpen => 'Открыто';

  @override
  String get businessClosed => 'Закрыто';

  @override
  String get businessToday => 'Сегодня';

  @override
  String get businessPromotions => 'Акции';

  @override
  String get errorInvalidOtp => 'Неверный код';

  @override
  String get errorUnauthorized => 'Требуется вход';

  @override
  String get errorForbidden => 'Недостаточно прав';

  @override
  String get errorNotFound => 'Не найдено';

  @override
  String get errorNetwork => 'Проверьте подключение к интернету';

  @override
  String get errorTimeout => 'Превышено время ожидания';

  @override
  String get errorRateLimited => 'Слишком много попыток. Попробуйте позже';

  @override
  String get errorLoadFailed =>
      'Не удалось загрузить данные. Проверьте подключение и попробуйте снова.';

  @override
  String get errorServiceUnavailable =>
      'Сервис временно недоступен. Попробуйте позже.';

  @override
  String get deleteAccountTitle => 'Удалить аккаунт?';

  @override
  String get deleteAccountBody =>
      'Это действие необратимо. Будут удалены избранное, отзывы и доступ к заведениям. Если вы единственный владелец бизнеса, сначала передайте управление.';

  @override
  String get deleteAccountConfirmTitle => 'Подтвердите удаление';

  @override
  String get deleteAccountConfirmBody =>
      'Аккаунт будет удалён без возможности восстановления.';

  @override
  String get deleteAccountSuccess => 'Аккаунт удалён';

  @override
  String get deleteAccountConflict =>
      'Перед удалением передайте управление заведением другому владельцу.';

  @override
  String get deleteAccountFailed =>
      'Не удалось удалить аккаунт. Попробуйте позже.';

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count отзыва',
      many: '$count отзывов',
      few: '$count отзыва',
      one: '$count отзыв',
      zero: '0 отзывов',
    );
    return '$_temp0';
  }

  @override
  String placesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count места',
      many: '$count мест',
      few: '$count места',
      one: '$count место',
      zero: '0 мест',
    );
    return '$_temp0';
  }
}
