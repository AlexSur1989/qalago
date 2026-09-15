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
  String get favoritesLoadFailed => 'Не удалось загрузить избранное.';

  @override
  String get favoritesRemoveTooltip => 'Убрать из избранного';

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
}
