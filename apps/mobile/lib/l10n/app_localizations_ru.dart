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
  String get homePopularSection => 'Популярное';

  @override
  String get homeNearbySubtitle => 'Места рядом с вами · до 3 км';

  @override
  String get homeNearbyEmpty => 'В радиусе 3 км от вас пока нет заведений';

  @override
  String get homeNearbyCitySection => 'Места в городе';

  @override
  String get homeNearbyCitySubtitle =>
      'Заведения в радиусе 3 км от центра города';

  @override
  String get homeNearbyCityEmpty =>
      'В радиусе 3 км от центра города пока нет заведений';

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
  String get categoryAllBusinesses => 'Все заведения';

  @override
  String get categoryFallbackTitle => 'Категория';

  @override
  String get categorySubcategoriesError => 'Не удалось загрузить подкатегории';

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
  String get searchResultsLoadFailed => 'Не удалось загрузить результаты';

  @override
  String get searchInitialTitle => 'Найдите место или услугу';

  @override
  String get searchInitialBody =>
      'Ищите заведения, категории и услуги — например «маникюр» или «караоке».';

  @override
  String get searchRecentQueriesTitle => 'Недавние запросы';

  @override
  String get searchRecentQueriesClear => 'Очистить';

  @override
  String get searchSuggestionTypeCategory => 'Категория';

  @override
  String get searchSuggestionTypeSubcategory => 'Подкатегория';

  @override
  String get searchContinueTyping =>
      'Продолжайте ввод — нужно минимум 2 символа';

  @override
  String get searchEmptyHintSpelling => 'Проверьте написание';

  @override
  String get searchEmptyHintGeneral => 'Попробуйте более общий запрос';

  @override
  String get searchEmptyHintFilters => 'Измените фильтры или категорию';

  @override
  String get searchFiltersTitle => 'Фильтры';

  @override
  String searchFiltersWithCount(int count) {
    return 'Фильтры ($count)';
  }

  @override
  String get searchApplyFilters => 'Применить';

  @override
  String get searchResetFiltersOnly => 'Сбросить фильтры';

  @override
  String get searchSubcategoriesTitle => 'Подкategории';

  @override
  String get searchSubcategoryAll => 'Все подkategории';

  @override
  String get searchRadiusSectionTitle => 'Радиус поиска';

  @override
  String get searchSortRecommended => 'Рекомендуем';

  @override
  String get searchSortNearby => 'Ближайшие';

  @override
  String get searchSortRating => 'По рейтингу';

  @override
  String get searchSortPopular => 'Популярные';

  @override
  String get searchSortMenuTooltip => 'Сортировка';

  @override
  String get searchLoadMore => 'Показать ещё';

  @override
  String get searchLoadingMore => 'Загрузка…';

  @override
  String get searchLoadMoreFailed => 'Не удалось загрузить ещё';

  @override
  String get searchLoadMoreRetry => 'Повторить загрузку';

  @override
  String get searchEndOfResults => 'Показаны все результаты';

  @override
  String get searchEnterQuery => 'Введите название или выберите категорию';

  @override
  String searchFoundCount(int count) {
    return 'Найдено: $count';
  }

  @override
  String searchFoundCountPartial(int shown, int total) {
    return 'Показано $shown из $total';
  }

  @override
  String get searchUpdatingResults => 'Обновление результатов';

  @override
  String get searchScopeClearSemantics => 'Убрать фильтр категории';

  @override
  String get searchClearCategoryScope => 'Убрать фильтр категории';

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
  String get searchLocationNeededForDistance =>
      'Чтобы искать по расстоянию, разрешите доступ к геопозиции';

  @override
  String get searchLocationDeniedForever =>
      'Доступ к геопозиции отключён. Включите его в настройках приложения.';

  @override
  String get searchOpenAppSettings => 'Открыть настройки';

  @override
  String get searchLocationServicesDisabled =>
      'Службы геолокации выключены. Включите GPS, чтобы искать рядом.';

  @override
  String get searchLocationOutsideSelectedCity =>
      'Ваша геопозиция далеко от выбранного города. Оставлен поиск по всему городу.';

  @override
  String get searchLocationUnavailable =>
      'Не удалось определить ваше местоположение. Попробуйте ещё раз.';

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
  String get favoritesLoadFailed => 'Не удалось загрузить избранное.';

  @override
  String get favoritesRemoveTooltip => 'Убрать из избранного';

  @override
  String get businessFavoriteAddTooltip => 'Добавить в избранное';

  @override
  String get favoritesEmptyUser => 'У вас пока нет избранных мест';

  @override
  String get favoritesEmptyUserHint =>
      'Добавляйте места в избранное, чтобы быстро вернуться к ним.';

  @override
  String favoritesEmptyInCity(String cityName) {
    return 'В $cityName пока нет избранных мест';
  }

  @override
  String get favoritesOtherCitiesHint =>
      'Избранные из других городов сохранены — смените город, чтобы увидеть их.';

  @override
  String get favoritesBrowseCategories => 'Перейти в категории';

  @override
  String get favoritesRemoveFailed =>
      'Не удалось убрать из избранного. Попробуйте ещё раз.';

  @override
  String favoritesRemoveAccessibility(String businessTitle) {
    return 'Удалить $businessTitle из избранного';
  }

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
  String get profileLogoutConfirmTitle => 'Выйти из аккаунта?';

  @override
  String get profileLogoutConfirmBody =>
      'Вы выйдете из текущей сессии на этом устройстве.';

  @override
  String get profileGuestBusinessSubtitle =>
      'Найдите заведение или подайте заявку — для продолжения потребуется вход.';

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
  String reviewsAll(int count) {
    return 'Все отзывы ($count)';
  }

  @override
  String reviewsShownCount(int shown, int total) {
    return 'Показано $shown из $total';
  }

  @override
  String get reviewYourReview => 'Ваш отзыв';

  @override
  String get reviewEditTitle => 'Редактировать отзыв';

  @override
  String get reviewDelete => 'Удалить отзыв';

  @override
  String get reviewDeleteTitle => 'Удалить отзыв?';

  @override
  String get reviewDeleteBody =>
      'Отзыв перестанет отображаться публично. Вы сможете оставить новый отзыв позже.';

  @override
  String get reviewCompanyReply => 'Ответ компании';

  @override
  String get reviewTextOptionalHint =>
      'Необязательно — можно оставить только оценку';

  @override
  String get reviewLoadMore => 'Загрузить ещё';

  @override
  String get reviewReport => 'Пожаловаться';

  @override
  String get reviewReportReason => 'Причина жалобы';

  @override
  String get reviewReportReasonSpam => 'Спам';

  @override
  String get reviewReportReasonInappropriate => 'Неподходящий контент';

  @override
  String get reviewReportReasonFalseInfo => 'Ложная информация';

  @override
  String get reviewReportReasonHarassment => 'Оскорбления или домогательства';

  @override
  String get reviewReportReasonOther => 'Другое';

  @override
  String get reviewReportDetailsOptional => 'Комментарий (необязательно)';

  @override
  String get reviewReportSubmit => 'Отправить жалобу';

  @override
  String get reviewReportSent =>
      'Жалоба отправлена. Спасибо, что помогаете поддерживать доверие.';

  @override
  String get reviewReportAlreadySubmitted =>
      'Вы уже отправляли жалобу на этот отзыв.';

  @override
  String get reviewReportNotReportable => 'На этот отзыв нельзя пожаловаться.';

  @override
  String get reviewSelfReviewForbidden =>
      'Нельзя оставить отзыв о своём заведении.';

  @override
  String get reviewAlreadyExists =>
      'У вас уже есть отзыв об этом месте. Отредактируйте его.';

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
  String get notificationsOwnerEmptyBody =>
      'Пока нет уведомлений. Здесь появятся отзывы, модерация и события по тарифу.';

  @override
  String get notificationsLoadMoreFailed => 'Не удалось загрузить ещё';

  @override
  String get notificationsLoadingMore => 'Загрузка…';

  @override
  String get notificationsEndOfList => 'Больше уведомлений нет';

  @override
  String get notificationNewReviewTitle => 'Новый отзыв';

  @override
  String get notificationNewReviewBody =>
      'О вашей компании оставили новый отзыв.';

  @override
  String notificationNewReviewBodyNamed(String businessName) {
    return 'О компании «$businessName» оставили новый отзыв.';
  }

  @override
  String get notificationReviewReplyTitle => 'Ответ на ваш отзыв';

  @override
  String get notificationReviewReplyBody => 'Компания ответила на ваш отзыв.';

  @override
  String notificationReviewReplyBodyNamed(String businessName) {
    return 'Компания «$businessName» ответила на ваш отзыв.';
  }

  @override
  String get notificationReviewHiddenTitle => 'Отзыв скрыт';

  @override
  String get notificationReviewHiddenBody =>
      'Ваш отзыв был скрыт после модерации.';

  @override
  String get notificationReviewRestoredTitle => 'Отзыв восстановлен';

  @override
  String get notificationReviewRestoredBody =>
      'Ваш отзыв снова доступен после модерации.';

  @override
  String get notificationBusinessApprovedTitle => 'Компания одобрена';

  @override
  String get notificationBusinessApprovedBody =>
      'Ваша компания прошла проверку.';

  @override
  String notificationBusinessApprovedBodyNamed(String businessName) {
    return 'Компания «$businessName» прошла проверку.';
  }

  @override
  String get notificationBusinessBlockedTitle => 'Компания заблокирована';

  @override
  String get notificationBusinessBlockedBody =>
      'Доступ к компании ограничен. Подробности — в кабинете.';

  @override
  String notificationBusinessBlockedBodyNamed(String businessName) {
    return 'Компания «$businessName» заблокирована. Подробности — в кабинете.';
  }

  @override
  String get notificationBusinessApplicationApprovedTitle => 'Заявка одобрена';

  @override
  String get notificationBusinessApplicationApprovedBody =>
      'Ваша заявка на добавление компании одобрена.';

  @override
  String get notificationBusinessApplicationRejectedTitle => 'Заявка отклонена';

  @override
  String get notificationBusinessApplicationRejectedBody =>
      'Ваша заявка на добавление компании отклонена.';

  @override
  String notificationBusinessApplicationRejectedBodyReason(String reason) {
    return 'Заявка отклонена: $reason';
  }

  @override
  String get notificationOwnershipClaimApprovedTitle =>
      'Заявка на владение одобрена';

  @override
  String get notificationOwnershipClaimApprovedBody =>
      'Ваша заявка на подтверждение владения одобрена.';

  @override
  String notificationOwnershipClaimApprovedBodyNamed(String businessName) {
    return 'Заявка на компанию «$businessName» одобрена.';
  }

  @override
  String get notificationOwnershipClaimRejectedTitle =>
      'Заявка на владение отклонена';

  @override
  String get notificationOwnershipClaimRejectedBody =>
      'Ваша заявка на подтверждение владения отклонена.';

  @override
  String notificationOwnershipClaimRejectedBodyReason(String reason) {
    return 'Заявка отклонена: $reason';
  }

  @override
  String get notificationInvitationReceivedTitle => 'Приглашение в команду';

  @override
  String get notificationInvitationReceivedBody =>
      'Вас пригласили управлять компанией.';

  @override
  String notificationInvitationReceivedBodyNamed(String businessName) {
    return 'Вас пригласили управлять «$businessName».';
  }

  @override
  String get notificationInvitationAcceptedTitle => 'Приглашение принято';

  @override
  String get notificationInvitationAcceptedBody =>
      'Пользователь принял приглашение в команду.';

  @override
  String notificationInvitationAcceptedBodyNamed(String businessName) {
    return 'Приглашение в «$businessName» принято.';
  }

  @override
  String get notificationPlanActivatedTitle => 'Тариф активирован';

  @override
  String get notificationPlanActivatedBody =>
      'Новый тариф для компании активен.';

  @override
  String notificationPlanActivatedBodyTier(String tier) {
    return 'Активирован тариф «$tier».';
  }

  @override
  String get notificationPlanExpiredTitle => 'Тариф завершён';

  @override
  String get notificationPlanExpiredBody =>
      'Срок действия тарифа истёк. Вы можете продлить его в кабинете.';

  @override
  String get notificationNewPromotionTitle => 'Новая акция';

  @override
  String get notificationNewPromotionBody =>
      'У компании появилась новая акция.';

  @override
  String notificationNewPromotionBodyNamed(String businessName) {
    return 'У «$businessName» новая акция.';
  }

  @override
  String get notificationAdCampaignApprovedTitle => 'Реклама одобрена';

  @override
  String get notificationAdCampaignApprovedBody =>
      'Ваш рекламный материал прошёл модерацию.';

  @override
  String get notificationAdCampaignRejectedTitle => 'Реклама отклонена';

  @override
  String get notificationAdCampaignRejectedBody =>
      'Рекламный материал не прошёл модерацию.';

  @override
  String notificationAdCampaignRejectedBodyReason(String reason) {
    return 'Реклама отклонена: $reason';
  }

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
  String get commonLater => 'Позже';

  @override
  String get commonUpdate => 'Обновить';

  @override
  String get commonSubmit => 'Отправить';

  @override
  String get searchTitle => 'Поиск';

  @override
  String get promotionsTitle => 'Акции';

  @override
  String get promotionsSearchHint => 'Поиск акций...';

  @override
  String get promotionsLoadFailed =>
      'Не удалось загрузить акции. Проверьте подключение.';

  @override
  String promotionsFoundCount(int count) {
    return 'Найдено $count акций';
  }

  @override
  String promotionsEmptyInCity(String cityName) {
    return 'В $cityName пока нет активных акций';
  }

  @override
  String get promotionsEmptyHint =>
      'Загляните позже — заведения регулярно добавляют новые предложения.';

  @override
  String get promotionsNoResultsHint =>
      'Попробуйте изменить поиск или категорию.';

  @override
  String get promotionsOpenBusiness => 'Открыть заведение';

  @override
  String get promotionExpired => 'Истекло';

  @override
  String get sponsoredPromoted => 'Продвигается';

  @override
  String get adDetailsDefault => 'Подробнее';

  @override
  String get adLabelPrefix => 'Реклама';

  @override
  String adSemanticLabel(String title) {
    return 'Реклама: $title';
  }

  @override
  String get cityPickerTitle => 'Выберите город';

  @override
  String get cityComingSoon => 'Скоро';

  @override
  String get cityCurrent => 'Текущий город';

  @override
  String get cityTapToSelect => 'Нажмите, чтобы выбрать';

  @override
  String get cityLoadFailed => 'Не удалось загрузить список городов';

  @override
  String emptyCityComingTitle(String cityName) {
    return '$cityName скоро откроется';
  }

  @override
  String emptyCitySoonTitle(String cityName) {
    return '$cityName скоро в QalaGo';
  }

  @override
  String get emptyCityComingBody =>
      'Мы готовим запуск города в QalaGo. Подключайте заведение заранее или выберите другой город.';

  @override
  String get emptyCityEmptyBody =>
      'Мы добавляем заведения и услуги. Пока каталог пуст — выберите другой город или предложите своё место.';

  @override
  String get emptyCityPickOther => 'Выбрать другой город';

  @override
  String get emptyCityAddBusiness => 'Добавить заведение';

  @override
  String get legalSectionTitle => 'Правовая информация';

  @override
  String get legalPrivacy => 'Политика конфиденциальности';

  @override
  String get legalTerms => 'Условия использования';

  @override
  String get legalConsentPrefix => 'Продолжая, вы принимаете ';

  @override
  String get legalConsentTerms => 'Условия использования';

  @override
  String get legalConsentAnd => ' и ознакомлены с ';

  @override
  String get legalConsentPrivacy => 'Политикой конфиденциальности';

  @override
  String get releaseUpdateAvailable => 'Доступно обновление';

  @override
  String get releaseRequiredBody =>
      'Для продолжения установите новую версию приложения.';

  @override
  String get releaseOptionalBody => 'Доступна новая версия QalaGo.';

  @override
  String get releaseStoreMissing => 'Ссылка на магазин пока не настроена.';

  @override
  String get profilePermissionsAllowed => 'Можно';

  @override
  String get profilePermissionsDenied => 'Нельзя';

  @override
  String profilePermissionsApps(String apps) {
    return 'Приложения: $apps';
  }

  @override
  String profilePermissionsModerationCity(String city) {
    return 'Город модерации: $city';
  }

  @override
  String get profileDevTestAccounts => 'Тестовые аккаунты (dev)';

  @override
  String get profileDevOtpHint => 'OTP-код: 1234';

  @override
  String get profileReviewsEmpty => 'Вы ещё не оставляли отзывов';

  @override
  String get profileReviewsEmptyHint =>
      'Откройте карточку заведения и поделитесь впечатлениями';

  @override
  String get profileReviewsGoHome => 'На главную';

  @override
  String get profileBusinessReply => 'Ответ заведения';

  @override
  String get profileOpenBusiness => 'Открыть заведение';

  @override
  String get profileHelpFaqTitle => 'Частые вопросы';

  @override
  String get profileHelpNeedSupport => 'Нужна помощь?';

  @override
  String get profileHelpSupportBody =>
      'Если у вас возникли вопросы по работе приложения, обратитесь в поддержку QalaGo через официальные каналы вашего города.';

  @override
  String get profileHelpTagline =>
      'QalaGo — городской гид и маркетплейс. MVP запущен в Уральске.';

  @override
  String get profileHelpFaq1Q => 'Как добавить заведение?';

  @override
  String get profileHelpFaq1A =>
      'В профиле выберите «Добавить заведение», заполните форму и дождитесь модерации.';

  @override
  String get profileHelpFaq2Q => 'Как сменить город?';

  @override
  String get profileHelpFaq2A =>
      'Нажмите название города на главной или в профиле → «Мой город». Для аккаунта город сохраняется в облаке.';

  @override
  String get profileHelpFaq3Q => 'Как оставить отзыв?';

  @override
  String get profileHelpFaq3A =>
      'Откройте карточку заведения, прокрутите до блока отзывов и нажмите «Оставить отзыв».';

  @override
  String get profileHelpFaq4Q => 'Не приходит код входа';

  @override
  String get profileHelpFaq4A =>
      'Проверьте номер телефона и подождите минуту. Если код не пришёл, нажмите «Отправить снова» на экране входа.';

  @override
  String get profileAboutVersion => 'Версия 1.0.0 (MVP)';

  @override
  String get profileAboutDescription =>
      'QalaGo — городской super-app: каталог заведений, акции, карта, отзывы и кабинет для бизнеса.';

  @override
  String get profileAboutMvpCityLabel => 'Город MVP';

  @override
  String get profileAboutMvpCityValue => 'Уральск';

  @override
  String get profileAboutRegionLabel => 'Регион';

  @override
  String get profileAboutRegionValue => 'Казахстан';

  @override
  String get profileAboutLanguagesLabel => 'Языки';

  @override
  String get profileAboutLanguagesValue => 'Русский · Қазақша';

  @override
  String profileAboutCopyright(int year) {
    return '© $year QalaGo. Все права защищены.';
  }

  @override
  String get profileEditNameRequired => 'Введите имя';

  @override
  String get profileEditSaved => 'Сохранено';

  @override
  String get profileEditNameLabel => 'Имя';

  @override
  String get profileEditNameHint => 'Как к вам обращаться';

  @override
  String get profileEditPhoneLabel => 'Телефон';

  @override
  String get profileEditPhoneHelp =>
      'Номер телефона меняется через поддержку или повторную регистрацию';

  @override
  String get profileEditChangePhoto => 'Изменить фото';

  @override
  String get profileEditTakePhoto => 'С камеры';

  @override
  String get profileEditFromGallery => 'Из галереи';

  @override
  String get profileEditRemovePhoto => 'Удалить фото';

  @override
  String get profileEditAvatarUpdated => 'Фото обновлено';

  @override
  String get profileEditAvatarRemoved => 'Фото удалено';

  @override
  String get profileEditAvatarFailed => 'Не удалось загрузить фото';

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
  String get businessInstagram => 'Instagram';

  @override
  String get businessAddress => 'Адрес';

  @override
  String get catalogNotFound => 'Ничего не найдено';

  @override
  String get onboardingForBusinessTitle => 'Для бизнеса';

  @override
  String get onboardingIntro =>
      'Добавьте или найдите свой бизнес. Если он уже есть в QalaGo, запросите доступ вместо создания новой карточки.';

  @override
  String get onboardingSearchLabel => 'Название или адрес';

  @override
  String get onboardingSearchAction => 'Искать';

  @override
  String get onboardingSearching => 'Поиск…';

  @override
  String get onboardingApplyIntro =>
      'Заявка будет проверена администрацией QalaGo. Доступ к кабинету появится после одобрения.';

  @override
  String get onboardingNameLabel => 'Название *';

  @override
  String get onboardingNameRequired => 'Введите название';

  @override
  String get onboardingCategoryLabel => 'Категория *';

  @override
  String get onboardingAddressLabel => 'Адрес *';

  @override
  String get onboardingAddressRequired => 'Введите адрес';

  @override
  String get businessLocationPickerHint =>
      'Если точка указана неточно — переместите карту.';

  @override
  String get businessLocationConfirm => 'Подтвердить точку';

  @override
  String get businessLocationCancel => 'Отмена';

  @override
  String get businessLocationAdjustOnMap => 'Уточнить на карте';

  @override
  String get businessLocationRequired =>
      'Выберите адрес из подсказок и подтвердите точку на карте';

  @override
  String get businessLocationGeocodingError =>
      'Не удалось загрузить подсказки адреса. Повторите позже.';

  @override
  String get businessLocationOutOfCityBounds =>
      'Точка находится за пределами выбранного города. Переместите карту в пределах города.';

  @override
  String get onboardingPhoneLabel => 'Телефон';

  @override
  String get onboardingDescriptionLabel => 'Краткое описание';

  @override
  String get onboardingSaveDraft => 'Сохранить черновик';

  @override
  String get onboardingSubmitReview => 'Отправить на проверку';

  @override
  String get onboardingSaving => 'Сохранение…';

  @override
  String get onboardingSubmitting => 'Отправка…';

  @override
  String get onboardingSubmitted => 'Заявка отправлена на проверку';

  @override
  String get onboardingClaimSentTitle => 'Заявка отправлена';

  @override
  String get onboardingClaimSentBody =>
      'Мы сообщим о результате после проверки.';

  @override
  String get onboardingClaimTitle => 'Подтвердить права владельца';

  @override
  String get onboardingClaimIntro =>
      'Заявка будет проверена администрацией QalaGo.';

  @override
  String get onboardingClaimMessageLabel =>
      'Сообщение для модератора (необязательно)';

  @override
  String get onboardingClaimSubmit => 'Отправить заявку';

  @override
  String get onboardingClaimsTitle => 'Подтверждение прав';

  @override
  String get onboardingClaimsEmpty => 'Заявок на подтверждение пока нет';

  @override
  String get onboardingApplicationsTitle => 'Мои заявки';

  @override
  String get onboardingApplicationsEmpty => 'Заявок пока нет';

  @override
  String get onboardingAddBusinessBtn => 'Добавить бизнес';

  @override
  String onboardingReasonPrefix(String reason) {
    return 'Причина: $reason';
  }

  @override
  String get onboardingStatusDraft => 'Черновик';

  @override
  String get onboardingStatusPending => 'На проверке';

  @override
  String get onboardingStatusApproved => 'Одобрено';

  @override
  String get onboardingStatusRejected => 'Отклонено';

  @override
  String get onboardingStatusCancelled => 'Отменено';

  @override
  String get onboardingRoleOwner => 'Владелец';

  @override
  String get onboardingRoleManager => 'Менеджер';

  @override
  String get onboardingErrorConflict =>
      'Заявка уже отправлена или статус изменился. Обновите страницу.';

  @override
  String get onboardingErrorDuplicate =>
      'Похожий бизнес уже есть в QalaGo. Попробуйте найти существующий.';

  @override
  String get onboardingErrorAlreadyOwner =>
      'У вас уже есть права владельца этого бизнеса.';

  @override
  String get onboardingErrorForbidden =>
      'Доступ ограничен. Обратитесь к администратору.';

  @override
  String get onboardingErrorGeneric =>
      'Не удалось выполнить действие. Попробуйте ещё раз.';

  @override
  String get claimCtaLoginTitle => 'Войдите';

  @override
  String get claimCtaLoginMessage =>
      'Чтобы подтвердить права владельца, войдите в аккаунт.';

  @override
  String get claimCtaYourBusiness => 'Это ваш бизнес?';

  @override
  String get claimCtaPending => 'Заявка на подтверждении';

  @override
  String get claimCtaConfirmOwner => 'Подтвердить права владельца';

  @override
  String get defaultSearchHint => 'Поиск...';

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
  String get deleteAccountButton => 'Удалить аккаунт';

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

  @override
  String get ownerPlanTierFree => 'Бесплатный';

  @override
  String get ownerPlanTierBasic => 'Бизнес';

  @override
  String get ownerPlanTierPremium => 'PRO';

  @override
  String get ownerPlanTierVip => 'VIP';

  @override
  String get ownerStatusActive => 'Активен';

  @override
  String get ownerStatusPendingModeration => 'На модерации';

  @override
  String get ownerStatusBlocked => 'Заблокирован';

  @override
  String get ownerPromotionStatusActive => 'Активна';

  @override
  String get ownerPromotionStatusExpired => 'Истекла';

  @override
  String get ownerPromotionFeedHint =>
      'Продвижение в ленте города — через рекламные продукты';

  @override
  String get ownerNotificationReviewNew => 'Новый отзыв';

  @override
  String get ownerNotificationReviewReply => 'Ответ на отзыв';

  @override
  String get ownerNotificationModeration => 'Модерация';

  @override
  String get ownerNotificationPromotion => 'Акция';

  @override
  String get ownerNotificationPlan => 'Тариф';

  @override
  String get ownerNotificationGeneral => 'Общее';

  @override
  String get ownerKpiViews => 'Просмотры';

  @override
  String get ownerKpiCalls => 'Звонки';

  @override
  String get ownerKpiRoutes => 'Маршруты';

  @override
  String get ownerKpiFavorites => 'Избранное';

  @override
  String get ownerAnalyticsFavorites => 'В избранное';

  @override
  String ownerAnalyticsDeltaPositive(int percent) {
    return '+$percent% к предыдущему периоду';
  }

  @override
  String ownerAnalyticsDeltaNegative(int percent) {
    return '$percent% к предыдущему периоду';
  }

  @override
  String get ownerAnalyticsDeltaZero => '0% к предыдущему периоду';

  @override
  String get ownerAnalyticsUpgradeActions => 'Доступно в тарифе Бизнес';

  @override
  String get ownerAnalyticsUpgradeSources =>
      'Источники, поисковые запросы и CTR доступны в PRO';

  @override
  String get ownerAnalyticsUpgradeAudience => 'Analytics 360 доступна в VIP';

  @override
  String get ownerPermissionProfileEdit => 'Редактирование профиля';

  @override
  String get ownerPermissionHoursEdit => 'График работы';

  @override
  String get ownerPermissionCatalogEdit => 'Товары и услуги';

  @override
  String get ownerPermissionPhotosEdit => 'Фото и галерея';

  @override
  String get ownerPermissionPromotionsEdit => 'Акции';

  @override
  String get ownerPermissionReviewsReply => 'Ответы на отзывы';

  @override
  String get ownerPermissionAnalyticsView => 'Просмотр статистики';

  @override
  String get ownerPermissionAnalyticsExport => 'Экспорт статистики';

  @override
  String get ownerPermissionAdsManage => 'Реклама и продвижение';

  @override
  String get ownerPermissionPaymentsView => 'Просмотр платежей';

  @override
  String get ownerMembershipStatusActive => 'Активен';

  @override
  String get ownerMembershipStatusSuspended => 'Приостановлен';

  @override
  String get ownerMembershipStatusRevoked => 'Доступ отозван';

  @override
  String get ownerMembershipStatusInvited => 'Приглашён';

  @override
  String get ownerPresetManager => 'Управляющий';

  @override
  String get ownerPresetManagerDesc =>
      'Операционный доступ без управления командой';

  @override
  String get ownerPresetContent => 'Контент-менеджер';

  @override
  String get ownerPresetContentDesc => 'Профиль, каталог, фото и акции';

  @override
  String get ownerPresetMarketing => 'Маркетолог';

  @override
  String get ownerPresetMarketingDesc => 'Акции, реклама и базовая аналитика';

  @override
  String get ownerPresetAnalytics => 'Аналитик';

  @override
  String get ownerPresetAnalyticsDesc => 'Просмотр и экспорт статистики';

  @override
  String ownerPermissionsMore(String head, int count) {
    return '$head · +$count';
  }

  @override
  String get monetizationProductBoost => 'Поднять карточку';

  @override
  String get monetizationProductTopCategory => 'TOP категории';

  @override
  String get monetizationProductPromotedPromotion => 'Продвинуть акцию';

  @override
  String get monetizationProductFeaturedBusiness => 'Популярное место';

  @override
  String get monetizationProductVipBanner => 'VIP-баннер';

  @override
  String get monetizationProductBoostDesc =>
      'Дополнительная видимость вашего бизнеса в категории.';

  @override
  String get monetizationProductTopCategoryDesc =>
      'Ваш бизнес показывается в приоритетном рекламном блоке своей категории.';

  @override
  String get monetizationProductPromotedPromotionDesc =>
      'Ваша акция получает дополнительное рекламное размещение в QalaGo.';

  @override
  String get monetizationProductFeaturedBusinessDesc =>
      'Ваш бизнес получает дополнительное размещение на главной странице.';

  @override
  String get monetizationProductVipBannerDesc =>
      'Большой рекламный баннер на главной странице QalaGo.';

  @override
  String get monetizationProductDefaultDesc => 'Рекламное размещение в QalaGo.';

  @override
  String get monetizationProductTopCategoryNote =>
      'Позиции распределяются автоматически между активными рекламодателями.';

  @override
  String get monetizationOrderAwaitingPayment => 'Ожидает оплаты';

  @override
  String get monetizationOrderPaid => 'Оплачен';

  @override
  String get monetizationOrderRefunded => 'Возврат';

  @override
  String get monetizationOrderPartialRefund => 'Частичный возврат';

  @override
  String get monetizationCampaignPendingModeration => 'На модерации';

  @override
  String get monetizationCampaignScheduled => 'Запланирована';

  @override
  String get monetizationCampaignPaused => 'Приостановлено';

  @override
  String get monetizationCampaignCompleted => 'Завершено';

  @override
  String get monetizationCreativePending => 'На проверке';

  @override
  String get monetizationCreativeApproved => 'Одобрен';

  @override
  String get monetizationAnalyticsCardOpen => 'Открытия карточки';

  @override
  String get monetizationAnalyticsPromotionOpen => 'Открытия акции';

  @override
  String get monetizationPurchaseAvailable => 'Доступно';

  @override
  String get monetizationPurchaseActive => 'Активно';

  @override
  String get monetizationPurchaseSoldOut => 'Мест нет';

  @override
  String get monetizationActionBuy => 'Купить';

  @override
  String get monetizationActionContinuePayment => 'Продолжить оплату';

  @override
  String get monetizationActionRenew => 'Продлить';

  @override
  String get monetizationReasonPendingOrder =>
      'У вас уже есть неоплаченный заказ на это размещение.';

  @override
  String get monetizationReasonConflict =>
      'Размещение конфликтует с текущим графиком.';

  @override
  String get monetizationReasonAlreadyActive => 'Размещение уже активно.';

  @override
  String get monetizationReasonAlreadyScheduled =>
      'Размещение уже запланировано.';

  @override
  String get monetizationReasonTargetPromoted => 'Эта акция уже продвигается.';

  @override
  String get monetizationReasonCategoryIneligible =>
      'Категория не подходит для этого продукта.';

  @override
  String get monetizationReasonPromotionIneligible =>
      'Акция недоступна для продвижения.';

  @override
  String get monetizationReasonSoldOut =>
      'Свободных мест нет на выбранный период.';

  @override
  String get monetizationReasonPackageConflict =>
      'Компоненты пакета не укладываются в доступные слоты.';

  @override
  String get monetizationReasonReservationExpired =>
      'Резерв места истёк — обновите статус и попробуйте снова.';

  @override
  String get monetizationReasonGeneric => 'Не удалось выполнить операцию.';

  @override
  String monetizationReasonGenericWithCode(String code) {
    return 'Не удалось выполнить операцию ($code).';
  }

  @override
  String get monetizationVipModerationNotice =>
      'VIP-баннер будет опубликован после проверки модератором. Оплаченный период начнётся только после одобрения баннера.';

  @override
  String get monetizationPackageVipNotice =>
      'Пакет включает VIP-баннер. Для запуска VIP-размещения необходимо настроить баннер и пройти модерацию.';

  @override
  String get monetizationPackageVipCta => 'Настроить VIP-баннер';

  @override
  String get monetizationPaymentInfoNotice =>
      'После подтверждения оплаты продвижение будет активировано автоматически.';

  @override
  String get monetizationPaymentMethodUnavailable =>
      'Способ оплаты будет доступен после подключения платёжного сервиса.';

  @override
  String get monetizationCtrTooltip =>
      'CTR — доля переходов от количества засчитанных просмотров рекламы.';

  @override
  String get ownerInvitationStatusPending => 'Приглашение активно';

  @override
  String get ownerInvitationStatusAccepted => 'Приглашение уже принято';

  @override
  String get ownerInvitationStatusRevoked => 'Приглашение отозвано';

  @override
  String get ownerInvitationStatusExpired => 'Срок приглашения истёк';

  @override
  String ownerDurationDays(int count, String unit) {
    return '$count $unit';
  }

  @override
  String ownerDurationHours(int count) {
    return '$count ч';
  }

  @override
  String get ownerDayUnitOne => 'день';

  @override
  String get ownerDayUnitFew => 'дня';

  @override
  String get ownerDayUnitMany => 'дней';

  @override
  String get ownerNavOverview => 'Обзор';

  @override
  String get ownerNavAnalytics => 'Статистика';

  @override
  String get ownerNavPromote => 'Реклама и продвижение';

  @override
  String get ownerNavMessages => 'Сообщения';

  @override
  String get ownerNavPlan => 'Тариф';

  @override
  String get ownerNavTeam => 'Команда';

  @override
  String get ownerNavSettings => 'Настройки';

  @override
  String get ownerNavHelp => 'Помощь';

  @override
  String get ownerNavBackToApp => 'В приложение QalaGo';

  @override
  String get ownerBusinessDrawerTitle => 'QalaGo Business';

  @override
  String get ownerDashboardTitle => 'Кабинет бизнеса';

  @override
  String get ownerAddBusiness => 'Добавить';

  @override
  String get ownerBusinessLabel => 'Заведение';

  @override
  String ownerWelcome(String title) {
    return 'Добро пожаловать, $title!';
  }

  @override
  String get ownerNoBusinessesTitle => 'Нет заведений';

  @override
  String get ownerNoBusinessesBody =>
      'Зарегистрируйте заведение — после модерации оно появится в QalaGo.';

  @override
  String get ownerRegisterBusiness => 'Зарегистрировать заведение';

  @override
  String ownerSummaryWeek(int views, int actions) {
    return '$views просмотров · $actions действий за 7 дней';
  }

  @override
  String ownerDeltaWeek(String delta) {
    return '$delta за нед.';
  }

  @override
  String get ownerViewsChartTitle => 'Просмотры за 7 дней';

  @override
  String get ownerTrendsLockedHint =>
      'График действий по дням доступен на тарифе «Бизнес» и выше.';

  @override
  String get ownerPlanUsageTitle => 'Использование тарифа';

  @override
  String get ownerProfileCard => 'Профиль';

  @override
  String ownerProfileCompletion(int percent) {
    return '$percent% заполнено';
  }

  @override
  String get ownerFillProfile => 'Заполнить';

  @override
  String get ownerUpgradePlan => 'Улучшить';

  @override
  String get ownerActivePromotions => 'Активные акции';

  @override
  String get ownerNoActivePromotions => 'Нет активных акций';

  @override
  String get ownerPromoteCatalogSubtitle =>
      'VIP-баннер, TOP категории, продвижение акций и пакеты';

  @override
  String get ownerOpenCatalog => 'Открыть каталог';

  @override
  String get ownerMyCampaigns => 'Мои кампании';

  @override
  String get ownerManagementSection => 'Управление';

  @override
  String get ownerPreviewCard => 'Предпросмотр карточки';

  @override
  String get ownerMgmtMyBusiness => 'Мой бизнес';

  @override
  String get ownerMgmtGallery => 'Галерея';

  @override
  String get ownerMgmtPromotions => 'Акции';

  @override
  String get ownerMgmtReviews => 'Отзывы';

  @override
  String ownerErrorWithDetails(String details) {
    return 'Ошибка: $details';
  }

  @override
  String get ownerSaving => 'Сохранение…';

  @override
  String get ownerSubmitting => 'Отправка…';

  @override
  String get ownerConfirm => 'Подтвердить';

  @override
  String get ownerRevoke => 'Отозвать';

  @override
  String get ownerDefaultBusiness => 'Заведение';

  @override
  String get ownerDefaultMember => 'Участник';

  @override
  String get ownerDefaultManager => 'Менеджер';

  @override
  String get ownerDefaultUser => 'Пользователь';

  @override
  String get ownerTeamNoAccessTitle => 'Нет доступа';

  @override
  String get ownerTeamNoAccessBody =>
      'Управление командой доступно только владельцу заведения.';

  @override
  String get ownerGoHome => 'На главную';

  @override
  String get ownerInvite => 'Пригласить';

  @override
  String get ownerTeamMembers => 'Участники';

  @override
  String get ownerTeamNoMembers => 'Нет участников';

  @override
  String get ownerTeamPendingInvites => 'Ожидают приглашения';

  @override
  String get ownerTeamNoPendingInvites => 'Нет ожидающих приглашений';

  @override
  String get ownerTeamPlanNoManagers => 'Тариф не включает менеджеров.';

  @override
  String get ownerTeamManagerLimit =>
      'Достигнут лимит менеджеров вашего тарифа.';

  @override
  String get ownerViewPlans => 'Посмотреть тарифы';

  @override
  String get ownerTeamManagersUnavailable =>
      'Менеджеры недоступны на текущем тарифе';

  @override
  String ownerTeamManagersUsage(int used, int limit) {
    return 'Менеджеры: $used из $limit';
  }

  @override
  String ownerTeamManagersExtra(int active, int pending) {
    return ' ($active активных · $pending ожидают)';
  }

  @override
  String get ownerSuspendManagerTitle => 'Приостановить доступ менеджера?';

  @override
  String get ownerSuspendManagerBody =>
      'Менеджер временно потеряет доступ к управлению бизнесом.';

  @override
  String get ownerAccessSuspended => 'Доступ приостановлен';

  @override
  String get ownerAccessRestored => 'Доступ восстановлен';

  @override
  String get ownerRevokeManagerTitle => 'Удалить доступ менеджера?';

  @override
  String get ownerRevokeManagerBody =>
      'Менеджер больше не сможет управлять этим бизнесом.';

  @override
  String get ownerAccessRevoked => 'Доступ отозван';

  @override
  String get ownerEditPermissions => 'Изменить права';

  @override
  String get ownerSuspend => 'Приостановить';

  @override
  String get ownerRemoveAccess => 'Удалить доступ';

  @override
  String get ownerRestore => 'Восстановить';

  @override
  String get ownerRevokeInviteTitle => 'Отозвать приглашение?';

  @override
  String ownerRevokeInviteBody(String email) {
    return 'Отозвать приглашение для $email?';
  }

  @override
  String get ownerInviteRevoked => 'Приглашение отозвано';

  @override
  String ownerInviteStatusLine(String status, String expires) {
    return '$status · до $expires';
  }

  @override
  String get ownerInvalidEmail => 'Укажите корректный email';

  @override
  String get ownerSelectPermission => 'Выберите хотя бы одно право доступа';

  @override
  String get ownerInviteCreated => 'Приглашение создано';

  @override
  String get ownerManagerAdded => 'Менеджер добавлен в команду';

  @override
  String get ownerInviteManagerTitle => 'Пригласить менеджера';

  @override
  String get ownerInviteManagerBody =>
      'Укажите email и права. После создания отправьте ссылку менеджеру.';

  @override
  String get ownerAccessPermissions => 'Права доступа';

  @override
  String get ownerInviteLinkHint =>
      'Отправьте эту ссылку менеджеру. Она одноразовая и действует ограниченное время.';

  @override
  String get ownerLinkCopied => 'Ссылка скопирована';

  @override
  String get ownerCopyLink => 'Скопировать ссылку';

  @override
  String get ownerSendInvite => 'Отправить приглашение';

  @override
  String get ownerPermissionsUpdated => 'Права обновлены';

  @override
  String get ownerManagerPermissionsTitle => 'Права менеджера';

  @override
  String get ownerMonetizationTitle => 'Реклама и продвижение';

  @override
  String get ownerSelectBusinessFirst => 'Сначала выберите заведение';

  @override
  String get ownerChoosePromotionMethod => 'Выберите способ продвижения';

  @override
  String get ownerPriceLoadFailed =>
      'Не удалось получить цены. Проверьте подключение.';

  @override
  String get ownerProductsUnavailable =>
      'Рекламные продукты временно недоступны.';

  @override
  String get ownerReadyPackages => 'Готовые пакеты';

  @override
  String get ownerPackagesLoadFailed => 'Не удалось загрузить пакеты.';

  @override
  String get ownerMyPromotions => 'Мои продвижения';

  @override
  String get ownerMyOrders => 'Мои заказы';

  @override
  String get ownerProductTitle => 'Продукт';

  @override
  String get ownerBusinessNotSelected => 'Заведение не выбрано';

  @override
  String get ownerPriceFailedShort => 'Не удалось получить цены.';

  @override
  String get ownerProductNotFound => 'Продукт не найден';

  @override
  String get ownerPeriodLabel => 'Период';

  @override
  String get ownerStartLabel => 'Начало';

  @override
  String get ownerStartAfterPayment => 'Сразу после оплаты';

  @override
  String get ownerPickDate => 'Выбрать дату';

  @override
  String get ownerSelectDate => 'Выберите дату';

  @override
  String ownerDiscountPercent(String percent) {
    return 'Скидка $percent%';
  }

  @override
  String get ownerGetQuote => 'Получить стоимость';

  @override
  String get ownerQuoteFailed => 'Не удалось получить стоимость.';

  @override
  String get ownerPromotionsLoadFailed => 'Не удалось загрузить акции.';

  @override
  String get ownerCreatePromotionFirst => 'Сначала создайте активную акцию.';

  @override
  String get ownerCreatePromotion => 'Создать акцию';

  @override
  String get ownerSelectPromotion => 'Выберите акцию';

  @override
  String ownerActiveUntil(String date) {
    return 'Активно до $date';
  }

  @override
  String ownerNextAvailableDate(String date) {
    return 'Ближайшая доступная дата: $date';
  }

  @override
  String ownerReservedUntil(String date) {
    return 'Место зарезервировано до $date';
  }

  @override
  String ownerPriceFrom(String price) {
    return 'от $price';
  }

  @override
  String get ownerCostLabel => 'Стоимость';

  @override
  String get ownerTotalLabel => 'Итого';

  @override
  String get ownerSlotsOccupied =>
      'На выбранный период рекламные места заняты.';

  @override
  String get ownerSettingsTitle => 'Настройки';

  @override
  String get ownerAccountSection => 'Аккаунт';

  @override
  String get ownerPhoneLabel => 'Телефон';

  @override
  String get ownerPhoneMissing => 'Телефон не указан';

  @override
  String get ownerDisplayNameLabel => 'Имя владельца';

  @override
  String get ownerDisplayNameHint => 'Как отображать в кабинете';

  @override
  String get ownerNameSaved => 'Имя сохранено';

  @override
  String get ownerBusinessSection => 'Заведение';

  @override
  String get ownerBusinessSettingsHint =>
      'Редактируйте карточку, часы и контакты в профиле.';

  @override
  String get ownerGallery => 'Галерея';

  @override
  String get ownerNoBusinessApply =>
      'Нет заведения — подайте заявку на модерацию.';

  @override
  String get ownerRegister => 'Зарегистрировать';

  @override
  String get ownerSecuritySection => 'Безопасность';

  @override
  String get ownerSecurityHint =>
      'Вход по SMS-коду. Для смены номера обратитесь в поддержку.';

  @override
  String get ownerReviewReplySaved => 'Ответ сохранён';

  @override
  String ownerReviewsTitle(String title) {
    return 'Отзывы · $title';
  }

  @override
  String get ownerNoReviews => 'Пока нет отзывов';

  @override
  String ownerReviewsSummary(int total, String unanswered) {
    return '$total отзывов$unanswered';
  }

  @override
  String ownerReviewsUnansweredSuffix(int count) {
    return ' · $count без ответа';
  }

  @override
  String ownerYourReply(String reply) {
    return 'Ваш ответ: $reply';
  }

  @override
  String get ownerReplyLabel => 'Ответ владельца';

  @override
  String get ownerReplyAction => 'Ответить';

  @override
  String get ownerUpdateReply => 'Обновить';

  @override
  String ownerPromotionLimit(int max) {
    return 'Лимит активных акций: $max. Улучшите тариф.';
  }

  @override
  String get ownerNewPromotion => 'Новая акция';

  @override
  String get ownerEditPromotion => 'Редактировать акцию';

  @override
  String get ownerFieldTitle => 'Название';

  @override
  String get ownerFieldDiscount => 'Скидка';

  @override
  String get ownerFieldDescription => 'Описание';

  @override
  String get ownerFieldTitleKkOptional =>
      'Название на казахском (необязательно)';

  @override
  String get ownerFieldDescriptionKkOptional =>
      'Описание на казахском (необязательно)';

  @override
  String get ownerFieldStatus => 'Статус';

  @override
  String get ownerPromotionStatusCompleted => 'Завершена';

  @override
  String get ownerCreate => 'Создать';

  @override
  String get ownerPromotionCreated => 'Акция создана';

  @override
  String get ownerPromotionUpdated => 'Акция обновлена';

  @override
  String get ownerDeletePromotionTitle => 'Удалить акцию?';

  @override
  String ownerDeletePromotionBody(String title) {
    return '«$title» будет удалена без восстановления.';
  }

  @override
  String get ownerPromotionDeleted => 'Акция удалена';

  @override
  String ownerPromotionsTitle(String title) {
    return 'Акции · $title';
  }

  @override
  String get ownerNoPromotions => 'Пока нет акций';

  @override
  String get ownerNoPromotionsHint =>
      'Создайте первую акцию для привлечения гостей';

  @override
  String ownerActivePromotionsCount(int active, int max) {
    return 'Активных: $active / $max';
  }

  @override
  String get ownerEdit => 'Редактировать';

  @override
  String get ownerPlanTitle => 'Тариф';

  @override
  String get ownerRegisterBusinessFirst => 'Сначала зарегистрируйте заведение';

  @override
  String get ownerPlanUpdated => 'Тариф обновлён';

  @override
  String ownerPlanCurrent(String name) {
    return 'Текущий: $name';
  }

  @override
  String get ownerPlanPromoteSubtitle => 'TOP, VIP-баннер, пакеты и статистика';

  @override
  String get ownerPlanPeriodMonth => 'месяц';

  @override
  String ownerPlanPeriodDays(int days) {
    return '$days дн.';
  }

  @override
  String get ownerMenuEmpty => 'Пока нет позиций в меню';

  @override
  String get ownerMenuOtherGroup => 'Прочее';

  @override
  String get ownerTeamForbidden => 'У вас нет прав для этого действия.';

  @override
  String get ownerTeamNotFound => 'Запись не найдена.';

  @override
  String get ownerTeamActionFailed =>
      'Не удалось выполнить действие. Попробуйте позже.';

  @override
  String get ownerInviteNotFound =>
      'Приглашение не найдено или ссылка недействительна.';

  @override
  String get ownerAcceptingInvite => 'Принимаем…';

  @override
  String get ownerAcceptInvite => 'Принять приглашение';

  @override
  String ownerGalleryTitle(String title) {
    return 'Галерея · $title';
  }

  @override
  String ownerPhotoLimitSnackbar(int max) {
    return 'Лимит тарифа: не более $max фото. Улучшите тариф в разделе «Тариф».';
  }

  @override
  String get ownerCoverUpdated => 'Обложка обновлена';

  @override
  String get ownerPhotoAdded => 'Фото добавлено';

  @override
  String ownerUploadError(String details) {
    return 'Ошибка загрузки: $details';
  }

  @override
  String ownerPhotosUsage(int used, int max, String suffix) {
    return 'Фото: $used / $max$suffix';
  }

  @override
  String get ownerPhotoLimitReached => ' · лимит достигнут';

  @override
  String get ownerGalleryEmpty => 'Галерея пустая';

  @override
  String get ownerGalleryEmptyHint => 'Добавьте фото интерьера, блюд или услуг';

  @override
  String get ownerCoverLabel => 'Обложка';

  @override
  String get ownerSetCover => 'Сделать обложкой';

  @override
  String get ownerPhotoLabel => 'Фото';

  @override
  String get ownerEditProfileTitle => 'Профиль заведения';

  @override
  String get ownerFieldShortDesc => 'Краткое описание';

  @override
  String get ownerFieldFullDesc => 'Полное описание';

  @override
  String get ownerContactsSection => 'Контакты';

  @override
  String get ownerWorkHoursSection => 'График работы';

  @override
  String get ownerWorkHoursFormat => 'Формат: 09:00-22:00';

  @override
  String get ownerWorkHoursWeekdays => 'Пн–Пт';

  @override
  String get ownerWorkHoursSaturday => 'Суббота';

  @override
  String get ownerWorkHoursSunday => 'Воскресенье';

  @override
  String get ownerRequiredNameAddress => 'Заполните название и адрес';

  @override
  String get ownerProfileSaved => 'Профиль заведения сохранён';

  @override
  String get ownerSubcategoriesSection => 'Подкатегории';

  @override
  String get ownerSubcategoriesHint =>
      'Выберите типы заведения внутри категории — так пользователи быстрее найдут вас в приложении.';

  @override
  String get ownerSubcategoriesEmpty =>
      'Подкатегории пока не настроены для вашей категории.';

  @override
  String get ownerSubcategoriesLoadFailed =>
      'Не удалось загрузить подкатегории. Проверьте сеть и попробуйте снова.';

  @override
  String get ownerSaveSubcategories => 'Сохранить подкатегории';

  @override
  String get ownerSubcategoriesSaved => 'Подкатегории сохранены';

  @override
  String get ownerAnalyticsTitle => 'Статистика';

  @override
  String get ownerAnalyticsAds => 'Реклама';

  @override
  String get ownerAnalyticsLoadFailed =>
      'Не удалось загрузить статистику. Проверьте сеть и попробуйте снова.';

  @override
  String ownerAnalyticsPeriodDays(int days) {
    return '$days дн';
  }

  @override
  String get ownerAnalyticsOverview => 'Обзор';

  @override
  String get ownerAnalyticsTargetActions => 'Целевые действия';

  @override
  String get ownerAnalyticsAdsStats => 'Статистика рекламы';

  @override
  String get ownerAnalyticsAcquisition => 'Привлечение';

  @override
  String get ownerAnalyticsSourcesPro => 'Источники доступны в PRO';

  @override
  String get ownerAnalyticsSourcesEmpty => 'Источники';

  @override
  String get ownerAnalyticsNotEnoughData => 'Недостаточно данных';

  @override
  String get ownerAnalyticsSearchQueries => 'Что ищут пользователи';

  @override
  String get ownerAnalyticsSearchEmpty =>
      'Недостаточно данных для анализа поисковых запросов';

  @override
  String get ownerAnalyticsSearchPro => 'Поисковые запросы доступны в PRO';

  @override
  String get ownerExportFailed =>
      'Не удалось подготовить отчёт. Попробуйте ещё раз.';

  @override
  String get ownerExportForbidden =>
      'Экспорт недоступен для вашей роли или тарифа.';

  @override
  String get ownerExportCsv => 'Экспорт CSV';

  @override
  String get ownerExportPreparing => 'Формирование…';

  @override
  String ownerSearchOtherQueries(String count) {
    return 'Другие запросы — $count';
  }

  @override
  String ownerSearchTransitions(String count) {
    return '$count переходов';
  }

  @override
  String get ownerSourcesDetailLater =>
      'Детальная атрибуция источников появится позже.';

  @override
  String get ownerBenchmarkSection => 'Сравнение с категорией';

  @override
  String get ownerBenchmarkNotEnough =>
      'Пока недостаточно данных для сравнения';

  @override
  String get ownerRecommendationsSection => 'Рекомендации';

  @override
  String get ownerPackageTitle => 'Пакет';

  @override
  String get ownerPackageNotFound => 'Пакет не найден';

  @override
  String get ownerPackageContents => 'Состав пакета';

  @override
  String get ownerPackageQuoteFailed => 'Не удалось получить стоимость пакета.';

  @override
  String get ownerNoPromotionsForAds => 'Нет активных акций для продвижения.';

  @override
  String get ownerOrderTitle => 'Заказ';

  @override
  String get ownerOrderCreated => 'Заказ создан';

  @override
  String get ownerToPay => 'К оплате:';

  @override
  String get ownerRefreshStatus => 'Обновить статус';

  @override
  String get ownerNoOrders => 'У вас пока нет заказов';

  @override
  String get ownerOrdersLoadFailed => 'Не удалось загрузить заказы.';

  @override
  String get ownerOrderNotFound => 'Заказ не найден.';

  @override
  String get ownerYourOrder => 'Ваш заказ';

  @override
  String get ownerAfterPayment => 'после оплаты';

  @override
  String get ownerConfirmOrder => 'Подтвердить заказ';

  @override
  String get ownerOrderCreateFailed => 'Не удалось создать заказ.';

  @override
  String get ownerCampaignsLoadFailed => 'Не удалось загрузить продвижения.';

  @override
  String get ownerNoCampaigns => 'Нет активных продвижений';

  @override
  String get ownerCampaignGroupActive => 'Активные';

  @override
  String get ownerCampaignGroupScheduled => 'Запланированные';

  @override
  String get ownerCampaignGroupModeration => 'На модерации';

  @override
  String get ownerCampaignGroupCompleted => 'Завершённые';

  @override
  String get ownerCampaignGroupOther => 'Другие';

  @override
  String ownerCampaignDaysLeft(int days, String unit) {
    return 'Осталось $days $unit';
  }

  @override
  String ownerCampaignMetrics(String served, String views, String clicks) {
    return 'Показы: $served · Просмотры: $views · Переходы: $clicks';
  }

  @override
  String get ownerCampaignNotFound => 'Кампания не найдена.';

  @override
  String ownerCampaignPeriod(String range) {
    return 'Период: $range';
  }

  @override
  String get ownerCampaignStatsFailed => 'Не удалось загрузить статистику.';

  @override
  String get ownerCampaignStatsPending =>
      'Статистика появится после начала показов.';

  @override
  String get ownerCampaignViews => 'Просмотры';

  @override
  String get ownerCampaignClicks => 'Переходы';

  @override
  String get ownerGotIt => 'Понятно';

  @override
  String get ownerCampaignActions => 'Действия';

  @override
  String get ownerVipBannerTitle => 'VIP-баннер';

  @override
  String get ownerVipImageLoadFailed => 'Не удалось загрузить изображение.';

  @override
  String get ownerVipTitleMinLength => 'Введите заголовок (минимум 2 символа).';

  @override
  String get ownerVipSaveFailed => 'Не удалось сохранить баннер.';

  @override
  String get ownerVipHeadlineLabel => 'Заголовок';

  @override
  String get ownerVipHeadlineHint => 'Заголовок баннера';

  @override
  String get ownerVipDescriptionOptional => 'Описание (необязательно)';

  @override
  String get ownerVipButtonLabel => 'Текст кнопки';

  @override
  String get ownerVipDefaultButton => 'Подробнее';

  @override
  String get ownerVipUploadImage => 'Загрузить изображение';

  @override
  String get ownerVipReplaceImage => 'Заменить изображение';

  @override
  String get ownerHidePreview => 'Скрыть предпросмотр';

  @override
  String get ownerShowPreview => 'Предпросмотр';

  @override
  String get ownerContinueToOrder => 'Продолжить к заказу';

  @override
  String get ownerAnalyticsCardViews => 'Просмотры карточки';

  @override
  String get ownerAnalyticsImpressionsLabel => 'Показы';

  @override
  String get ownerAnalyticsConversionTitle => 'Конверсия в действие';

  @override
  String get ownerAnalyticsConversionHint =>
      'Доля просмотров карточки, после которых пользователь совершил целевое действие: звонок, WhatsApp, маршрут, сайт, Instagram или добавление в избранное.';

  @override
  String ownerAnalyticsChartViewsDays(int days) {
    return 'Просмотры за $days дн.';
  }

  @override
  String ownerAnalyticsChartActionsDays(int days) {
    return 'Действия за $days дн.';
  }

  @override
  String ownerAnalyticsFunnelStepImpressions(String count) {
    return '$count показов';
  }

  @override
  String ownerAnalyticsFunnelStepViews(String count) {
    return '$count просмотров';
  }

  @override
  String ownerAnalyticsFunnelStepActions(String count) {
    return '$count целевых действий';
  }

  @override
  String get ownerAnalyticsPeriodFunnel => 'Воронка периода';

  @override
  String ownerAnalyticsConversionLine(String value) {
    return 'Конверсия в действие: $value';
  }

  @override
  String get ownerAnalyticsAggregatedNote =>
      'Показатели рассчитаны по агрегированным данным периода.';

  @override
  String get ownerAnalyticsVsPreviousPeriod => 'К предыдущему периоду';

  @override
  String get ownerAnalyticsPopularHours => 'Популярное время';

  @override
  String get ownerAnalyticsAudience => 'Аудитория';

  @override
  String get ownerAnalyticsAudienceSubtitle =>
      'Доли просмотров карточки по типу посетителя';

  @override
  String get ownerAnalyticsNewVisitors => 'Новые посетители';

  @override
  String get ownerAnalyticsReturningVisitors => 'Вернувшиеся посетители';

  @override
  String get ownerAnalyticsAudienceDistanceEmpty =>
      'Недостаточно данных для анализа аудитории по расстоянию';

  @override
  String ownerAnalyticsViewsShare(String share) {
    return 'Доля просмотров: $share';
  }

  @override
  String get ownerAnalyticsUniqueVisitors => 'Уникальные посетители';

  @override
  String get ownerAnalyticsSessions => 'Сессии';

  @override
  String get ownerAnalyticsDailyUniqueSum =>
      'Суммарно уникальных посетителей по дням';

  @override
  String get ownerAnalyticsDailySessionsSum => 'Суммарно сессий по дням';

  @override
  String get ownerAnalyticsDistanceTitle => 'Расстояние до заведения';

  @override
  String get ownerAnalyticsDistanceHint =>
      'Агрегированные интервалы без точных координат пользователей.';

  @override
  String get ownerAnalyticsContentSection => 'Контент';

  @override
  String ownerAnalyticsPromotionViewsLine(String count) {
    return 'Просмотры акций: $count';
  }

  @override
  String ownerAnalyticsPromotionItemTitle(String id) {
    return 'Акция · $id';
  }

  @override
  String get ownerAnalyticsPromotionActionsNotMeasured =>
      'Действия по акциям пока не измеряются';

  @override
  String get ownerAnalyticsCatalogSection => 'Каталог';

  @override
  String ownerAnalyticsCatalogItemTitle(String id) {
    return 'Позиция · $id';
  }

  @override
  String get ownerAnalyticsCatalogItemEmpty => 'Позиция';

  @override
  String get ownerAnalyticsCatalogActionsNotMeasured =>
      'Действия по позициям каталога пока не измеряются';

  @override
  String get ownerAnalyticsStatsAfterFirstView =>
      'Статистика появится после первых просмотров карточки.';

  @override
  String get ownerAnalyticsSegmentViews => 'Просмотры';

  @override
  String get ownerAnalyticsSegmentActions => 'Действия';

  @override
  String get ownerHelpQuickStart => 'Быстрый старт';

  @override
  String get ownerHelpStep1 => '1. Заполните профиль и загрузите фото';

  @override
  String get ownerHelpStep2 => '2. Добавьте меню или услуги';

  @override
  String get ownerHelpStep3 => '3. Создайте первую акцию';

  @override
  String get ownerHelpStep4 => '4. Смотрите статистику на главной';

  @override
  String get ownerHelpPlansPromote => 'Тарифы и продвижение';

  @override
  String get ownerTeamInvitationTitle => 'Приглашение в команду';

  @override
  String ownerInvitationForEmail(String email) {
    return 'Для: $email';
  }

  @override
  String get ownerMenuNewGroup => 'Новая группа';

  @override
  String get ownerMenuEditGroup => 'Редактировать группу';

  @override
  String get ownerMenuGroupNameLabel => 'Название группы *';

  @override
  String get ownerMenuGroupNameHint => 'Например: Горячие блюда, Стрижка';

  @override
  String get ownerMenuNewItem => 'Новая позиция';

  @override
  String get ownerMenuGroupField => 'Группа';

  @override
  String get ownerMenuNoGroup => 'Без группы';

  @override
  String get ownerMenuPriceLabel => 'Цена (₸)';

  @override
  String ownerCatalogServicesTitle(String title) {
    return 'Товары и услуги · $title';
  }

  @override
  String get ownerMenuAddGroup => 'Группа';

  @override
  String get ownerMenuAddItem => 'Позиция';

  @override
  String get ownerMenuNoSection => 'Без раздела';

  @override
  String get ownerMenuHideItem => 'Скрыть';

  @override
  String get ownerMenuShowItem => 'Показать';

  @override
  String get ownerPlanPurchaseUnavailable => 'Покупка недоступна';

  @override
  String get ownerPlanGoToAds => 'Перейти к рекламе';

  @override
  String ownerScheduledRange(String start, String end) {
    return '$start — $end';
  }

  @override
  String get onboardingWelcomeHeadline => 'Ваш город рядом';

  @override
  String get onboardingWelcomeBody =>
      'Находите места, услуги и предложения в вашем городе.';

  @override
  String get onboardingWelcomeCta => 'Начать';

  @override
  String get onboardingLanguageLabel => 'Язык приложения';

  @override
  String get onboardingCityTitle => 'Выберите город';

  @override
  String get onboardingCityBody =>
      'Вы всегда сможете изменить город позже в профиле.';

  @override
  String get onboardingCityCta => 'Продолжить';
}
