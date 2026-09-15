import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_kk.dart';
import 'app_localizations_ru.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('kk'),
    Locale('ru'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In ru, this message translates to:
  /// **'QalaGo'**
  String get appTitle;

  /// No description provided for @navHome.
  ///
  /// In ru, this message translates to:
  /// **'Главная'**
  String get navHome;

  /// No description provided for @navCategories.
  ///
  /// In ru, this message translates to:
  /// **'Категории'**
  String get navCategories;

  /// No description provided for @navMap.
  ///
  /// In ru, this message translates to:
  /// **'Карта'**
  String get navMap;

  /// No description provided for @navFavorites.
  ///
  /// In ru, this message translates to:
  /// **'Избранное'**
  String get navFavorites;

  /// No description provided for @navProfile.
  ///
  /// In ru, this message translates to:
  /// **'Профиль'**
  String get navProfile;

  /// No description provided for @commonRetry.
  ///
  /// In ru, this message translates to:
  /// **'Повторить'**
  String get commonRetry;

  /// No description provided for @commonCancel.
  ///
  /// In ru, this message translates to:
  /// **'Отмена'**
  String get commonCancel;

  /// No description provided for @commonSave.
  ///
  /// In ru, this message translates to:
  /// **'Сохранить'**
  String get commonSave;

  /// No description provided for @commonBack.
  ///
  /// In ru, this message translates to:
  /// **'Назад'**
  String get commonBack;

  /// No description provided for @commonDone.
  ///
  /// In ru, this message translates to:
  /// **'Готово'**
  String get commonDone;

  /// No description provided for @commonMore.
  ///
  /// In ru, this message translates to:
  /// **'Ещё'**
  String get commonMore;

  /// No description provided for @commonTryAgain.
  ///
  /// In ru, this message translates to:
  /// **'Попробовать снова'**
  String get commonTryAgain;

  /// No description provided for @commonSomethingWrong.
  ///
  /// In ru, this message translates to:
  /// **'Что-то пошло не так'**
  String get commonSomethingWrong;

  /// No description provided for @commonNoData.
  ///
  /// In ru, this message translates to:
  /// **'Нет данных'**
  String get commonNoData;

  /// No description provided for @commonContinue.
  ///
  /// In ru, this message translates to:
  /// **'Продолжить'**
  String get commonContinue;

  /// No description provided for @commonDelete.
  ///
  /// In ru, this message translates to:
  /// **'Удалить'**
  String get commonDelete;

  /// No description provided for @commonLogin.
  ///
  /// In ru, this message translates to:
  /// **'Войти'**
  String get commonLogin;

  /// No description provided for @commonReset.
  ///
  /// In ru, this message translates to:
  /// **'Сбросить'**
  String get commonReset;

  /// No description provided for @commonAll.
  ///
  /// In ru, this message translates to:
  /// **'Все'**
  String get commonAll;

  /// No description provided for @commonAllCategories.
  ///
  /// In ru, this message translates to:
  /// **'Все категории'**
  String get commonAllCategories;

  /// No description provided for @commonAd.
  ///
  /// In ru, this message translates to:
  /// **'Реклама'**
  String get commonAd;

  /// No description provided for @commonViewAll.
  ///
  /// In ru, this message translates to:
  /// **'Смотреть все'**
  String get commonViewAll;

  /// No description provided for @homeSearchPlaceholder.
  ///
  /// In ru, this message translates to:
  /// **'Поиск заведений и услуг...'**
  String get homeSearchPlaceholder;

  /// No description provided for @homeCategoriesEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Категории пока не добавлены'**
  String get homeCategoriesEmpty;

  /// No description provided for @homePromotionsEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Нет активных акций'**
  String get homePromotionsEmpty;

  /// No description provided for @homePopularEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Нет популярных заведений'**
  String get homePopularEmpty;

  /// No description provided for @homePromotionsSection.
  ///
  /// In ru, this message translates to:
  /// **'Акции и предложения'**
  String get homePromotionsSection;

  /// No description provided for @homeNearbySection.
  ///
  /// In ru, this message translates to:
  /// **'Рядом с вами'**
  String get homeNearbySection;

  /// No description provided for @homeRecommendedSection.
  ///
  /// In ru, this message translates to:
  /// **'Рекомендуем'**
  String get homeRecommendedSection;

  /// No description provided for @homeNearbySubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Места рядом с вами · до 3 км'**
  String get homeNearbySubtitle;

  /// No description provided for @homeNearbyEmpty.
  ///
  /// In ru, this message translates to:
  /// **'В радиусе 3 км от вас пока нет заведений'**
  String get homeNearbyEmpty;

  /// No description provided for @homeNotificationsTooltip.
  ///
  /// In ru, this message translates to:
  /// **'Уведомления'**
  String get homeNotificationsTooltip;

  /// No description provided for @homeFeaturedPrevTooltip.
  ///
  /// In ru, this message translates to:
  /// **'Предыдущее заведение'**
  String get homeFeaturedPrevTooltip;

  /// No description provided for @homeFeaturedNextTooltip.
  ///
  /// In ru, this message translates to:
  /// **'Следующее заведение'**
  String get homeFeaturedNextTooltip;

  /// No description provided for @homeCategoryMoreSemantics.
  ///
  /// In ru, this message translates to:
  /// **'Ещё категории'**
  String get homeCategoryMoreSemantics;

  /// No description provided for @homeCategoriesSection.
  ///
  /// In ru, this message translates to:
  /// **'Категории'**
  String get homeCategoriesSection;

  /// No description provided for @categoriesTitle.
  ///
  /// In ru, this message translates to:
  /// **'Категории'**
  String get categoriesTitle;

  /// No description provided for @categoriesFilterHint.
  ///
  /// In ru, this message translates to:
  /// **'Фильтр по названию категории...'**
  String get categoriesFilterHint;

  /// No description provided for @categoriesSearchBusinesses.
  ///
  /// In ru, this message translates to:
  /// **'Поиск заведений'**
  String get categoriesSearchBusinesses;

  /// No description provided for @categoriesNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Категории не найдены'**
  String get categoriesNotFound;

  /// No description provided for @categoriesSort.
  ///
  /// In ru, this message translates to:
  /// **'Сортировка'**
  String get categoriesSort;

  /// No description provided for @categoryRecommended.
  ///
  /// In ru, this message translates to:
  /// **'Рекомендуемые'**
  String get categoryRecommended;

  /// No description provided for @categoryNearest.
  ///
  /// In ru, this message translates to:
  /// **'Ближе к вам'**
  String get categoryNearest;

  /// No description provided for @categoryByRating.
  ///
  /// In ru, this message translates to:
  /// **'По рейтингу'**
  String get categoryByRating;

  /// No description provided for @categoryPopular.
  ///
  /// In ru, this message translates to:
  /// **'Популярные'**
  String get categoryPopular;

  /// No description provided for @categoryEmpty.
  ///
  /// In ru, this message translates to:
  /// **'В этой категории пока нет мест'**
  String get categoryEmpty;

  /// No description provided for @categorySubEmpty.
  ///
  /// In ru, this message translates to:
  /// **'В этой подкатегории пока нет мест'**
  String get categorySubEmpty;

  /// No description provided for @categoryNearestNeedsLocation.
  ///
  /// In ru, this message translates to:
  /// **'Разрешите доступ к геопозиции, чтобы показать ближайшие места'**
  String get categoryNearestNeedsLocation;

  /// No description provided for @categorySponsored.
  ///
  /// In ru, this message translates to:
  /// **'Продвигаемые места'**
  String get categorySponsored;

  /// No description provided for @categoryAllPlaces.
  ///
  /// In ru, this message translates to:
  /// **'Все места'**
  String get categoryAllPlaces;

  /// No description provided for @searchPlaceholder.
  ///
  /// In ru, this message translates to:
  /// **'Поиск заведений и услуг...'**
  String get searchPlaceholder;

  /// No description provided for @searchResetFilters.
  ///
  /// In ru, this message translates to:
  /// **'Сбросить фильтры'**
  String get searchResetFilters;

  /// No description provided for @searchNoResults.
  ///
  /// In ru, this message translates to:
  /// **'Ничего не найдено'**
  String get searchNoResults;

  /// No description provided for @searchClearTooltip.
  ///
  /// In ru, this message translates to:
  /// **'Очистить'**
  String get searchClearTooltip;

  /// No description provided for @searchFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось выполнить поиск.'**
  String get searchFailed;

  /// No description provided for @searchEnterQuery.
  ///
  /// In ru, this message translates to:
  /// **'Введите название или выберите категорию'**
  String get searchEnterQuery;

  /// No description provided for @searchFoundCount.
  ///
  /// In ru, this message translates to:
  /// **'Найдено: {count}'**
  String searchFoundCount(int count);

  /// No description provided for @searchNoResultsQueryCategory.
  ///
  /// In ru, this message translates to:
  /// **'Ничего не найдено по запросу «{query}» в выбранной категории'**
  String searchNoResultsQueryCategory(String query);

  /// No description provided for @searchNoResultsQueryCity.
  ///
  /// In ru, this message translates to:
  /// **'Ничего не найдено по запросу «{query}» в {cityName}'**
  String searchNoResultsQueryCity(String query, String cityName);

  /// No description provided for @searchNoInCategoryRadius.
  ///
  /// In ru, this message translates to:
  /// **'Нет заведений в выбранной категории {radiusLabel}'**
  String searchNoInCategoryRadius(String radiusLabel);

  /// No description provided for @searchNoInCategory.
  ///
  /// In ru, this message translates to:
  /// **'Нет заведений в выбранной категории'**
  String get searchNoInCategory;

  /// No description provided for @searchRadiusWholeCity.
  ///
  /// In ru, this message translates to:
  /// **'Весь город'**
  String get searchRadiusWholeCity;

  /// No description provided for @searchRadiusKm.
  ///
  /// In ru, this message translates to:
  /// **'до {km} км'**
  String searchRadiusKm(int km);

  /// No description provided for @favoritesTitle.
  ///
  /// In ru, this message translates to:
  /// **'Избранное'**
  String get favoritesTitle;

  /// No description provided for @favoritesEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Здесь будут ваши избранные места'**
  String get favoritesEmpty;

  /// No description provided for @favoritesGuestTitle.
  ///
  /// In ru, this message translates to:
  /// **'Войдите, чтобы сохранять избранное'**
  String get favoritesGuestTitle;

  /// No description provided for @favoritesGuestBody.
  ///
  /// In ru, this message translates to:
  /// **'Добавляйте места в избранное и возвращайтесь к ним в один тап.'**
  String get favoritesGuestBody;

  /// No description provided for @favoritesRecent.
  ///
  /// In ru, this message translates to:
  /// **'Недавние'**
  String get favoritesRecent;

  /// No description provided for @favoritesByName.
  ///
  /// In ru, this message translates to:
  /// **'По названию'**
  String get favoritesByName;

  /// No description provided for @favoritesSortLabel.
  ///
  /// In ru, this message translates to:
  /// **'Сортировка:'**
  String get favoritesSortLabel;

  /// No description provided for @favoritesLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить избранное.'**
  String get favoritesLoadFailed;

  /// No description provided for @favoritesRemoveTooltip.
  ///
  /// In ru, this message translates to:
  /// **'Убрать из избранного'**
  String get favoritesRemoveTooltip;

  /// No description provided for @favoritesEmptyUser.
  ///
  /// In ru, this message translates to:
  /// **'У вас пока нет избранных мест'**
  String get favoritesEmptyUser;

  /// No description provided for @favoritesEmptyUserHint.
  ///
  /// In ru, this message translates to:
  /// **'Добавляйте места в избранное, чтобы быстро вернуться к ним.'**
  String get favoritesEmptyUserHint;

  /// No description provided for @favoritesEmptyInCity.
  ///
  /// In ru, this message translates to:
  /// **'В {cityName} пока нет избранных мест'**
  String favoritesEmptyInCity(String cityName);

  /// No description provided for @favoritesOtherCitiesHint.
  ///
  /// In ru, this message translates to:
  /// **'Избранные из других городов сохранены — смените город, чтобы увидеть их.'**
  String get favoritesOtherCitiesHint;

  /// No description provided for @searchRadiusKmExact.
  ///
  /// In ru, this message translates to:
  /// **'{km} км'**
  String searchRadiusKmExact(int km);

  /// No description provided for @mapTitle.
  ///
  /// In ru, this message translates to:
  /// **'Карта'**
  String get mapTitle;

  /// No description provided for @mapNoBusinessesNearby.
  ///
  /// In ru, this message translates to:
  /// **'Рядом нет заведений'**
  String get mapNoBusinessesNearby;

  /// No description provided for @mapEnableLocation.
  ///
  /// In ru, this message translates to:
  /// **'Включить геолокацию'**
  String get mapEnableLocation;

  /// No description provided for @mapLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить заведения на карте'**
  String get mapLoadFailed;

  /// No description provided for @mapCloseTooltip.
  ///
  /// In ru, this message translates to:
  /// **'Закрыть'**
  String get mapCloseTooltip;

  /// No description provided for @mapDetails.
  ///
  /// In ru, this message translates to:
  /// **'Подробнее'**
  String get mapDetails;

  /// No description provided for @mapBusinessesOnMap.
  ///
  /// In ru, this message translates to:
  /// **'Заведения на карте'**
  String get mapBusinessesOnMap;

  /// No description provided for @mapNoCoordinates.
  ///
  /// In ru, this message translates to:
  /// **'Нет заведений с координатами'**
  String get mapNoCoordinates;

  /// No description provided for @profileTitle.
  ///
  /// In ru, this message translates to:
  /// **'Профиль'**
  String get profileTitle;

  /// No description provided for @profileLanguageApplyHint.
  ///
  /// In ru, this message translates to:
  /// **'Смена языка применяется сразу.'**
  String get profileLanguageApplyHint;

  /// No description provided for @profileLanguage.
  ///
  /// In ru, this message translates to:
  /// **'Язык'**
  String get profileLanguage;

  /// No description provided for @profileLanguageRu.
  ///
  /// In ru, this message translates to:
  /// **'Русский'**
  String get profileLanguageRu;

  /// No description provided for @profileLanguageKk.
  ///
  /// In ru, this message translates to:
  /// **'Қазақша'**
  String get profileLanguageKk;

  /// No description provided for @profilePersonalData.
  ///
  /// In ru, this message translates to:
  /// **'Личные данные'**
  String get profilePersonalData;

  /// No description provided for @profileMyCity.
  ///
  /// In ru, this message translates to:
  /// **'Мой город'**
  String get profileMyCity;

  /// No description provided for @profileMyReviews.
  ///
  /// In ru, this message translates to:
  /// **'Мои отзывы'**
  String get profileMyReviews;

  /// No description provided for @profileNotifications.
  ///
  /// In ru, this message translates to:
  /// **'Уведомления'**
  String get profileNotifications;

  /// No description provided for @profilePermissions.
  ///
  /// In ru, this message translates to:
  /// **'Мои права'**
  String get profilePermissions;

  /// No description provided for @profileHelp.
  ///
  /// In ru, this message translates to:
  /// **'Помощь'**
  String get profileHelp;

  /// No description provided for @profileAbout.
  ///
  /// In ru, this message translates to:
  /// **'О приложении'**
  String get profileAbout;

  /// No description provided for @profileForBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Для бизнеса'**
  String get profileForBusiness;

  /// No description provided for @profileFindBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Найти свой бизнес'**
  String get profileFindBusiness;

  /// No description provided for @profileFindBusinessSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Если карточка уже есть в QalaGo'**
  String get profileFindBusinessSubtitle;

  /// No description provided for @profileAddBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Добавить бизнес'**
  String get profileAddBusiness;

  /// No description provided for @profileAddBusinessSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Создать новую заявку на добавление'**
  String get profileAddBusinessSubtitle;

  /// No description provided for @profileMyBusinesses.
  ///
  /// In ru, this message translates to:
  /// **'Мои бизнесы'**
  String get profileMyBusinesses;

  /// No description provided for @profileMyBusinessesSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Кабинет и управление'**
  String get profileMyBusinessesSubtitle;

  /// No description provided for @profileAddMoreBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Добавить ещё бизнес'**
  String get profileAddMoreBusiness;

  /// No description provided for @profileFindExistingBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Найти существующий бизнес'**
  String get profileFindExistingBusiness;

  /// No description provided for @profileFindExistingSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердить права владельца'**
  String get profileFindExistingSubtitle;

  /// No description provided for @profileMyApplications.
  ///
  /// In ru, this message translates to:
  /// **'Мои заявки'**
  String get profileMyApplications;

  /// No description provided for @profileMyApplicationsSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Статус заявок и подтверждений'**
  String get profileMyApplicationsSubtitle;

  /// No description provided for @profileModeration.
  ///
  /// In ru, this message translates to:
  /// **'Модерация'**
  String get profileModeration;

  /// No description provided for @profileModerationSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Проверка заявок и статусов заведений'**
  String get profileModerationSubtitle;

  /// No description provided for @profileBusinessDefault.
  ///
  /// In ru, this message translates to:
  /// **'Бизнес'**
  String get profileBusinessDefault;

  /// No description provided for @profileLogout.
  ///
  /// In ru, this message translates to:
  /// **'Выйти'**
  String get profileLogout;

  /// No description provided for @profileSignOut.
  ///
  /// In ru, this message translates to:
  /// **'Выйти из аккаунта'**
  String get profileSignOut;

  /// No description provided for @profileGuestTitle.
  ///
  /// In ru, this message translates to:
  /// **'Войдите в аккаунт'**
  String get profileGuestTitle;

  /// No description provided for @profileGuestSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Сохраняйте избранное и оставляйте отзывы'**
  String get profileGuestSubtitle;

  /// No description provided for @profileGuestBody.
  ///
  /// In ru, this message translates to:
  /// **'Сохраняйте избранное, оставляйте отзывы и используйте персональные функции.'**
  String get profileGuestBody;

  /// No description provided for @profileCityLabel.
  ///
  /// In ru, this message translates to:
  /// **'Город: {name}'**
  String profileCityLabel(String name);

  /// No description provided for @profileDefaultUser.
  ///
  /// In ru, this message translates to:
  /// **'Пользователь'**
  String get profileDefaultUser;

  /// No description provided for @profilePhoneMissing.
  ///
  /// In ru, this message translates to:
  /// **'Телефон не указан'**
  String get profilePhoneMissing;

  /// No description provided for @authLoginTitle.
  ///
  /// In ru, this message translates to:
  /// **'Вход'**
  String get authLoginTitle;

  /// No description provided for @authPhoneHint.
  ///
  /// In ru, this message translates to:
  /// **'Номер телефона'**
  String get authPhoneHint;

  /// No description provided for @authCodeHint.
  ///
  /// In ru, this message translates to:
  /// **'Код из SMS'**
  String get authCodeHint;

  /// No description provided for @authSendCode.
  ///
  /// In ru, this message translates to:
  /// **'Получить код'**
  String get authSendCode;

  /// No description provided for @authVerify.
  ///
  /// In ru, this message translates to:
  /// **'Войти'**
  String get authVerify;

  /// No description provided for @authResendCode.
  ///
  /// In ru, this message translates to:
  /// **'Отправить код снова'**
  String get authResendCode;

  /// No description provided for @authResendIn.
  ///
  /// In ru, this message translates to:
  /// **'Повтор через {seconds} с'**
  String authResendIn(int seconds);

  /// No description provided for @authContinueWithGoogle.
  ///
  /// In ru, this message translates to:
  /// **'Войти через Google'**
  String get authContinueWithGoogle;

  /// No description provided for @authContinueWithApple.
  ///
  /// In ru, this message translates to:
  /// **'Войти через Apple'**
  String get authContinueWithApple;

  /// No description provided for @authGuestContinue.
  ///
  /// In ru, this message translates to:
  /// **'Продолжить без входа'**
  String get authGuestContinue;

  /// No description provided for @authLoginHeading.
  ///
  /// In ru, this message translates to:
  /// **'Вход в QalaGo'**
  String get authLoginHeading;

  /// No description provided for @authLoginSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Войдите, чтобы сохранять избранное, оставлять отзывы и управлять профилем.'**
  String get authLoginSubtitle;

  /// No description provided for @authOrDivider.
  ///
  /// In ru, this message translates to:
  /// **'или'**
  String get authOrDivider;

  /// No description provided for @authLoginByPhone.
  ///
  /// In ru, this message translates to:
  /// **'Войти по телефону'**
  String get authLoginByPhone;

  /// No description provided for @authChangePhone.
  ///
  /// In ru, this message translates to:
  /// **'Изменить номер'**
  String get authChangePhone;

  /// No description provided for @authPhoneInvalid.
  ///
  /// In ru, this message translates to:
  /// **'Проверьте номер телефона'**
  String get authPhoneInvalid;

  /// No description provided for @authEnterSmsCode.
  ///
  /// In ru, this message translates to:
  /// **'Введите код из SMS'**
  String get authEnterSmsCode;

  /// No description provided for @authCodeSentAgain.
  ///
  /// In ru, this message translates to:
  /// **'Код отправлен повторно'**
  String get authCodeSentAgain;

  /// No description provided for @authCodeSentTo.
  ///
  /// In ru, this message translates to:
  /// **'Код отправлен на {phone}'**
  String authCodeSentTo(String phone);

  /// No description provided for @authDevLogin.
  ///
  /// In ru, this message translates to:
  /// **'Войти без SMS (dev)'**
  String get authDevLogin;

  /// No description provided for @authOtpUnavailableBody.
  ///
  /// In ru, this message translates to:
  /// **'Вход через аккаунт временно недоступен в этой сборке. Можно продолжить как гость.'**
  String get authOtpUnavailableBody;

  /// No description provided for @authDevOtpHint.
  ///
  /// In ru, this message translates to:
  /// **'Локальная разработка: OTP может приходить через backend debug.'**
  String get authDevOtpHint;

  /// No description provided for @authContinueWithoutAccount.
  ///
  /// In ru, this message translates to:
  /// **'Продолжить без аккаунта'**
  String get authContinueWithoutAccount;

  /// No description provided for @businessCall.
  ///
  /// In ru, this message translates to:
  /// **'Позвонить'**
  String get businessCall;

  /// No description provided for @businessGenericName.
  ///
  /// In ru, this message translates to:
  /// **'Заведение'**
  String get businessGenericName;

  /// No description provided for @businessLoginTitle.
  ///
  /// In ru, this message translates to:
  /// **'Войдите в QalaGo'**
  String get businessLoginTitle;

  /// No description provided for @businessLoginFavoriteMessage.
  ///
  /// In ru, this message translates to:
  /// **'Чтобы сохранять избранное, войдите по номеру телефона.'**
  String get businessLoginFavoriteMessage;

  /// No description provided for @businessLoginReviewMessage.
  ///
  /// In ru, this message translates to:
  /// **'Чтобы оставить отзыв, войдите по номеру телефона.'**
  String get businessLoginReviewMessage;

  /// No description provided for @businessReviewSent.
  ///
  /// In ru, this message translates to:
  /// **'Отзыв отправлен'**
  String get businessReviewSent;

  /// No description provided for @businessAbout.
  ///
  /// In ru, this message translates to:
  /// **'О заведении'**
  String get businessAbout;

  /// No description provided for @businessAllPromotions.
  ///
  /// In ru, this message translates to:
  /// **'Все акции ({count})'**
  String businessAllPromotions(int count);

  /// No description provided for @businessProductsServices.
  ///
  /// In ru, this message translates to:
  /// **'Товары и услуги'**
  String get businessProductsServices;

  /// No description provided for @businessViewAllCount.
  ///
  /// In ru, this message translates to:
  /// **'Смотреть все ({count})'**
  String businessViewAllCount(int count);

  /// No description provided for @businessPhotos.
  ///
  /// In ru, this message translates to:
  /// **'Фотографии'**
  String get businessPhotos;

  /// No description provided for @businessAllPhotos.
  ///
  /// In ru, this message translates to:
  /// **'Все фото ({count})'**
  String businessAllPhotos(int count);

  /// No description provided for @businessNoReviewsYet.
  ///
  /// In ru, this message translates to:
  /// **'Пока нет отзывов'**
  String get businessNoReviewsYet;

  /// No description provided for @businessNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Заведение не найдено или недоступно'**
  String get businessNotFound;

  /// No description provided for @businessLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить информацию о заведении'**
  String get businessLoadFailed;

  /// No description provided for @businessNoReviewsShort.
  ///
  /// In ru, this message translates to:
  /// **'Нет отзывов'**
  String get businessNoReviewsShort;

  /// No description provided for @businessSchedule.
  ///
  /// In ru, this message translates to:
  /// **'График работы'**
  String get businessSchedule;

  /// No description provided for @businessContacts.
  ///
  /// In ru, this message translates to:
  /// **'Контакты'**
  String get businessContacts;

  /// No description provided for @businessOnMap.
  ///
  /// In ru, this message translates to:
  /// **'На карте'**
  String get businessOnMap;

  /// No description provided for @businessBuildRoute.
  ///
  /// In ru, this message translates to:
  /// **'Построить маршрут'**
  String get businessBuildRoute;

  /// No description provided for @businessEdit.
  ///
  /// In ru, this message translates to:
  /// **'Редактировать'**
  String get businessEdit;

  /// No description provided for @businessPromotionDefault.
  ///
  /// In ru, this message translates to:
  /// **'Акция'**
  String get businessPromotionDefault;

  /// No description provided for @businessPromotionValidUntil.
  ///
  /// In ru, this message translates to:
  /// **'до {date}'**
  String businessPromotionValidUntil(String date);

  /// No description provided for @catalogSearchHint.
  ///
  /// In ru, this message translates to:
  /// **'Найти товар или услугу'**
  String get catalogSearchHint;

  /// No description provided for @catalogPriceOnRequest.
  ///
  /// In ru, this message translates to:
  /// **'Цена по запросу'**
  String get catalogPriceOnRequest;

  /// No description provided for @catalogShowMore.
  ///
  /// In ru, this message translates to:
  /// **'Показать ещё'**
  String get catalogShowMore;

  /// No description provided for @photosTotal.
  ///
  /// In ru, this message translates to:
  /// **'Всего: {count}'**
  String photosTotal(int count);

  /// No description provided for @photosEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Нет фотографий'**
  String get photosEmpty;

  /// No description provided for @reviewWriteRequired.
  ///
  /// In ru, this message translates to:
  /// **'Напишите текст отзыва'**
  String get reviewWriteRequired;

  /// No description provided for @reviewCheckTitle.
  ///
  /// In ru, this message translates to:
  /// **'Проверьте отзыв'**
  String get reviewCheckTitle;

  /// No description provided for @reviewCheckBody.
  ///
  /// In ru, this message translates to:
  /// **'Текст может нарушать правила площадки. Отредактируйте отзыв или отправьте как есть — модератор проверит вручную.'**
  String get reviewCheckBody;

  /// No description provided for @reviewEdit.
  ///
  /// In ru, this message translates to:
  /// **'Редактировать'**
  String get reviewEdit;

  /// No description provided for @reviewSubmit.
  ///
  /// In ru, this message translates to:
  /// **'Отправить'**
  String get reviewSubmit;

  /// No description provided for @reviewRatingLabel.
  ///
  /// In ru, this message translates to:
  /// **'Оценка'**
  String get reviewRatingLabel;

  /// No description provided for @reviewYourReviewLabel.
  ///
  /// In ru, this message translates to:
  /// **'Ваш отзыв'**
  String get reviewYourReviewLabel;

  /// No description provided for @reviewLeaveButton.
  ///
  /// In ru, this message translates to:
  /// **'Оставить отзыв'**
  String get reviewLeaveButton;

  /// No description provided for @reviewLooksOk.
  ///
  /// In ru, this message translates to:
  /// **'Отзыв выглядит нормально'**
  String get reviewLooksOk;

  /// No description provided for @reviewPossibleViolations.
  ///
  /// In ru, this message translates to:
  /// **'Возможные нарушения'**
  String get reviewPossibleViolations;

  /// No description provided for @reviewRecommendCheck.
  ///
  /// In ru, this message translates to:
  /// **'Рекомендуем проверить текст'**
  String get reviewRecommendCheck;

  /// No description provided for @reviewQualityScore.
  ///
  /// In ru, this message translates to:
  /// **'Оценка качества: {score}/100'**
  String reviewQualityScore(int score);

  /// No description provided for @reviewLoginToLeave.
  ///
  /// In ru, this message translates to:
  /// **'Войдите, чтобы оставить отзыв'**
  String get reviewLoginToLeave;

  /// No description provided for @reviewLoginRequiredBody.
  ///
  /// In ru, this message translates to:
  /// **'Отзывы доступны авторизованным пользователям.'**
  String get reviewLoginRequiredBody;

  /// No description provided for @notificationsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Уведомления'**
  String get notificationsTitle;

  /// No description provided for @notificationsMarkAllRead.
  ///
  /// In ru, this message translates to:
  /// **'Прочитать все'**
  String get notificationsMarkAllRead;

  /// No description provided for @notificationsEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Нет уведомлений'**
  String get notificationsEmpty;

  /// No description provided for @cityNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Города не найдены'**
  String get cityNotFound;

  /// No description provided for @citySelectedSnack.
  ///
  /// In ru, this message translates to:
  /// **'Город: {name}'**
  String citySelectedSnack(String name);

  /// No description provided for @onboardingFindBusinessTitle.
  ///
  /// In ru, this message translates to:
  /// **'Найти свой бизнес'**
  String get onboardingFindBusinessTitle;

  /// No description provided for @onboardingNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Не нашли свой бизнес?'**
  String get onboardingNotFound;

  /// No description provided for @onboardingAddNew.
  ///
  /// In ru, this message translates to:
  /// **'Добавить новый бизнес'**
  String get onboardingAddNew;

  /// No description provided for @onboardingConfirmRights.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердить права'**
  String get onboardingConfirmRights;

  /// No description provided for @onboardingAddBusinessTitle.
  ///
  /// In ru, this message translates to:
  /// **'Добавить новый бизнес'**
  String get onboardingAddBusinessTitle;

  /// No description provided for @onboardingRejectionReason.
  ///
  /// In ru, this message translates to:
  /// **'Причина отклонения: {reason}'**
  String onboardingRejectionReason(String reason);

  /// No description provided for @onboardingOpenCabinet.
  ///
  /// In ru, this message translates to:
  /// **'Открыть кабинет'**
  String get onboardingOpenCabinet;

  /// No description provided for @onboardingDraftSaved.
  ///
  /// In ru, this message translates to:
  /// **'Черновик сохранён'**
  String get onboardingDraftSaved;

  /// No description provided for @commonLater.
  ///
  /// In ru, this message translates to:
  /// **'Позже'**
  String get commonLater;

  /// No description provided for @commonUpdate.
  ///
  /// In ru, this message translates to:
  /// **'Обновить'**
  String get commonUpdate;

  /// No description provided for @commonSubmit.
  ///
  /// In ru, this message translates to:
  /// **'Отправить'**
  String get commonSubmit;

  /// No description provided for @searchTitle.
  ///
  /// In ru, this message translates to:
  /// **'Поиск'**
  String get searchTitle;

  /// No description provided for @promotionsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Акции'**
  String get promotionsTitle;

  /// No description provided for @promotionsSearchHint.
  ///
  /// In ru, this message translates to:
  /// **'Поиск акций...'**
  String get promotionsSearchHint;

  /// No description provided for @promotionsLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить акции. Проверьте подключение.'**
  String get promotionsLoadFailed;

  /// No description provided for @promotionsFoundCount.
  ///
  /// In ru, this message translates to:
  /// **'Найдено {count} акций'**
  String promotionsFoundCount(int count);

  /// No description provided for @promotionsEmptyInCity.
  ///
  /// In ru, this message translates to:
  /// **'В {cityName} пока нет активных акций'**
  String promotionsEmptyInCity(String cityName);

  /// No description provided for @promotionsEmptyHint.
  ///
  /// In ru, this message translates to:
  /// **'Загляните позже — заведения регулярно добавляют новые предложения.'**
  String get promotionsEmptyHint;

  /// No description provided for @promotionsNoResultsHint.
  ///
  /// In ru, this message translates to:
  /// **'Попробуйте изменить поиск или категорию.'**
  String get promotionsNoResultsHint;

  /// No description provided for @promotionsOpenBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Открыть заведение'**
  String get promotionsOpenBusiness;

  /// No description provided for @promotionExpired.
  ///
  /// In ru, this message translates to:
  /// **'Истекло'**
  String get promotionExpired;

  /// No description provided for @sponsoredPromoted.
  ///
  /// In ru, this message translates to:
  /// **'Продвигается'**
  String get sponsoredPromoted;

  /// No description provided for @adDetailsDefault.
  ///
  /// In ru, this message translates to:
  /// **'Подробнее'**
  String get adDetailsDefault;

  /// No description provided for @adLabelPrefix.
  ///
  /// In ru, this message translates to:
  /// **'Реклама'**
  String get adLabelPrefix;

  /// No description provided for @adSemanticLabel.
  ///
  /// In ru, this message translates to:
  /// **'Реклама: {title}'**
  String adSemanticLabel(String title);

  /// No description provided for @cityPickerTitle.
  ///
  /// In ru, this message translates to:
  /// **'Выберите город'**
  String get cityPickerTitle;

  /// No description provided for @cityComingSoon.
  ///
  /// In ru, this message translates to:
  /// **'Скоро'**
  String get cityComingSoon;

  /// No description provided for @cityCurrent.
  ///
  /// In ru, this message translates to:
  /// **'Текущий город'**
  String get cityCurrent;

  /// No description provided for @cityTapToSelect.
  ///
  /// In ru, this message translates to:
  /// **'Нажмите, чтобы выбрать'**
  String get cityTapToSelect;

  /// No description provided for @cityLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить список городов'**
  String get cityLoadFailed;

  /// No description provided for @emptyCityComingTitle.
  ///
  /// In ru, this message translates to:
  /// **'{cityName} скоро откроется'**
  String emptyCityComingTitle(String cityName);

  /// No description provided for @emptyCitySoonTitle.
  ///
  /// In ru, this message translates to:
  /// **'{cityName} скоро в QalaGo'**
  String emptyCitySoonTitle(String cityName);

  /// No description provided for @emptyCityComingBody.
  ///
  /// In ru, this message translates to:
  /// **'Мы готовим запуск города в QalaGo. Подключайте заведение заранее или выберите другой город.'**
  String get emptyCityComingBody;

  /// No description provided for @emptyCityEmptyBody.
  ///
  /// In ru, this message translates to:
  /// **'Мы добавляем заведения и услуги. Пока каталог пуст — выберите другой город или предложите своё место.'**
  String get emptyCityEmptyBody;

  /// No description provided for @emptyCityPickOther.
  ///
  /// In ru, this message translates to:
  /// **'Выбрать другой город'**
  String get emptyCityPickOther;

  /// No description provided for @emptyCityAddBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Добавить заведение'**
  String get emptyCityAddBusiness;

  /// No description provided for @legalSectionTitle.
  ///
  /// In ru, this message translates to:
  /// **'Правовая информация'**
  String get legalSectionTitle;

  /// No description provided for @legalPrivacy.
  ///
  /// In ru, this message translates to:
  /// **'Политика конфиденциальности'**
  String get legalPrivacy;

  /// No description provided for @legalTerms.
  ///
  /// In ru, this message translates to:
  /// **'Условия использования'**
  String get legalTerms;

  /// No description provided for @legalConsentPrefix.
  ///
  /// In ru, this message translates to:
  /// **'Продолжая, вы принимаете '**
  String get legalConsentPrefix;

  /// No description provided for @legalConsentTerms.
  ///
  /// In ru, this message translates to:
  /// **'Условия использования'**
  String get legalConsentTerms;

  /// No description provided for @legalConsentAnd.
  ///
  /// In ru, this message translates to:
  /// **' и ознакомлены с '**
  String get legalConsentAnd;

  /// No description provided for @legalConsentPrivacy.
  ///
  /// In ru, this message translates to:
  /// **'Политикой конфиденциальности'**
  String get legalConsentPrivacy;

  /// No description provided for @releaseUpdateAvailable.
  ///
  /// In ru, this message translates to:
  /// **'Доступно обновление'**
  String get releaseUpdateAvailable;

  /// No description provided for @releaseRequiredBody.
  ///
  /// In ru, this message translates to:
  /// **'Для продолжения установите новую версию приложения.'**
  String get releaseRequiredBody;

  /// No description provided for @releaseOptionalBody.
  ///
  /// In ru, this message translates to:
  /// **'Доступна новая версия QalaGo.'**
  String get releaseOptionalBody;

  /// No description provided for @releaseStoreMissing.
  ///
  /// In ru, this message translates to:
  /// **'Ссылка на магазин пока не настроена.'**
  String get releaseStoreMissing;

  /// No description provided for @profilePermissionsAllowed.
  ///
  /// In ru, this message translates to:
  /// **'Можно'**
  String get profilePermissionsAllowed;

  /// No description provided for @profilePermissionsDenied.
  ///
  /// In ru, this message translates to:
  /// **'Нельзя'**
  String get profilePermissionsDenied;

  /// No description provided for @profilePermissionsApps.
  ///
  /// In ru, this message translates to:
  /// **'Приложения: {apps}'**
  String profilePermissionsApps(String apps);

  /// No description provided for @profilePermissionsModerationCity.
  ///
  /// In ru, this message translates to:
  /// **'Город модерации: {city}'**
  String profilePermissionsModerationCity(String city);

  /// No description provided for @profileDevTestAccounts.
  ///
  /// In ru, this message translates to:
  /// **'Тестовые аккаунты (dev)'**
  String get profileDevTestAccounts;

  /// No description provided for @profileDevOtpHint.
  ///
  /// In ru, this message translates to:
  /// **'OTP-код: 1234'**
  String get profileDevOtpHint;

  /// No description provided for @profileReviewsEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Вы ещё не оставляли отзывов'**
  String get profileReviewsEmpty;

  /// No description provided for @profileReviewsEmptyHint.
  ///
  /// In ru, this message translates to:
  /// **'Откройте карточку заведения и поделитесь впечатлениями'**
  String get profileReviewsEmptyHint;

  /// No description provided for @profileReviewsGoHome.
  ///
  /// In ru, this message translates to:
  /// **'На главную'**
  String get profileReviewsGoHome;

  /// No description provided for @profileBusinessReply.
  ///
  /// In ru, this message translates to:
  /// **'Ответ заведения'**
  String get profileBusinessReply;

  /// No description provided for @profileOpenBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Открыть заведение'**
  String get profileOpenBusiness;

  /// No description provided for @profileHelpFaqTitle.
  ///
  /// In ru, this message translates to:
  /// **'Частые вопросы'**
  String get profileHelpFaqTitle;

  /// No description provided for @profileHelpNeedSupport.
  ///
  /// In ru, this message translates to:
  /// **'Нужна помощь?'**
  String get profileHelpNeedSupport;

  /// No description provided for @profileHelpSupportBody.
  ///
  /// In ru, this message translates to:
  /// **'Если у вас возникли вопросы по работе приложения, обратитесь в поддержку QalaGo через официальные каналы вашего города.'**
  String get profileHelpSupportBody;

  /// No description provided for @profileHelpTagline.
  ///
  /// In ru, this message translates to:
  /// **'QalaGo — городской гид и маркетплейс. MVP запущен в Уральске.'**
  String get profileHelpTagline;

  /// No description provided for @profileHelpFaq1Q.
  ///
  /// In ru, this message translates to:
  /// **'Как добавить заведение?'**
  String get profileHelpFaq1Q;

  /// No description provided for @profileHelpFaq1A.
  ///
  /// In ru, this message translates to:
  /// **'В профиле выберите «Добавить заведение», заполните форму и дождитесь модерации.'**
  String get profileHelpFaq1A;

  /// No description provided for @profileHelpFaq2Q.
  ///
  /// In ru, this message translates to:
  /// **'Как сменить город?'**
  String get profileHelpFaq2Q;

  /// No description provided for @profileHelpFaq2A.
  ///
  /// In ru, this message translates to:
  /// **'Нажмите название города на главной или в профиле → «Мой город». Для аккаунта город сохраняется в облаке.'**
  String get profileHelpFaq2A;

  /// No description provided for @profileHelpFaq3Q.
  ///
  /// In ru, this message translates to:
  /// **'Как оставить отзыв?'**
  String get profileHelpFaq3Q;

  /// No description provided for @profileHelpFaq3A.
  ///
  /// In ru, this message translates to:
  /// **'Откройте карточку заведения, прокрутите до блока отзывов и нажмите «Оставить отзыв».'**
  String get profileHelpFaq3A;

  /// No description provided for @profileHelpFaq4Q.
  ///
  /// In ru, this message translates to:
  /// **'Не приходит код входа'**
  String get profileHelpFaq4Q;

  /// No description provided for @profileHelpFaq4A.
  ///
  /// In ru, this message translates to:
  /// **'Проверьте номер телефона и подождите минуту. Если код не пришёл, нажмите «Отправить снова» на экране входа.'**
  String get profileHelpFaq4A;

  /// No description provided for @profileAboutVersion.
  ///
  /// In ru, this message translates to:
  /// **'Версия 1.0.0 (MVP)'**
  String get profileAboutVersion;

  /// No description provided for @profileAboutDescription.
  ///
  /// In ru, this message translates to:
  /// **'QalaGo — городской super-app: каталог заведений, акции, карта, отзывы и кабинет для бизнеса.'**
  String get profileAboutDescription;

  /// No description provided for @profileAboutMvpCityLabel.
  ///
  /// In ru, this message translates to:
  /// **'Город MVP'**
  String get profileAboutMvpCityLabel;

  /// No description provided for @profileAboutMvpCityValue.
  ///
  /// In ru, this message translates to:
  /// **'Уральск'**
  String get profileAboutMvpCityValue;

  /// No description provided for @profileAboutRegionLabel.
  ///
  /// In ru, this message translates to:
  /// **'Регион'**
  String get profileAboutRegionLabel;

  /// No description provided for @profileAboutRegionValue.
  ///
  /// In ru, this message translates to:
  /// **'Казахстан'**
  String get profileAboutRegionValue;

  /// No description provided for @profileAboutLanguagesLabel.
  ///
  /// In ru, this message translates to:
  /// **'Языки'**
  String get profileAboutLanguagesLabel;

  /// No description provided for @profileAboutLanguagesValue.
  ///
  /// In ru, this message translates to:
  /// **'Русский · Қазақша'**
  String get profileAboutLanguagesValue;

  /// No description provided for @profileAboutCopyright.
  ///
  /// In ru, this message translates to:
  /// **'© {year} QalaGo. Все права защищены.'**
  String profileAboutCopyright(int year);

  /// No description provided for @profileEditNameRequired.
  ///
  /// In ru, this message translates to:
  /// **'Введите имя'**
  String get profileEditNameRequired;

  /// No description provided for @profileEditSaved.
  ///
  /// In ru, this message translates to:
  /// **'Сохранено'**
  String get profileEditSaved;

  /// No description provided for @profileEditNameLabel.
  ///
  /// In ru, this message translates to:
  /// **'Имя'**
  String get profileEditNameLabel;

  /// No description provided for @profileEditNameHint.
  ///
  /// In ru, this message translates to:
  /// **'Как к вам обращаться'**
  String get profileEditNameHint;

  /// No description provided for @profileEditPhoneLabel.
  ///
  /// In ru, this message translates to:
  /// **'Телефон'**
  String get profileEditPhoneLabel;

  /// No description provided for @profileEditPhoneHelp.
  ///
  /// In ru, this message translates to:
  /// **'Номер телефона меняется через поддержку или повторную регистрацию'**
  String get profileEditPhoneHelp;

  /// No description provided for @profileEditChangePhoto.
  ///
  /// In ru, this message translates to:
  /// **'Изменить фото'**
  String get profileEditChangePhoto;

  /// No description provided for @profileEditTakePhoto.
  ///
  /// In ru, this message translates to:
  /// **'С камеры'**
  String get profileEditTakePhoto;

  /// No description provided for @profileEditFromGallery.
  ///
  /// In ru, this message translates to:
  /// **'Из галереи'**
  String get profileEditFromGallery;

  /// No description provided for @profileEditRemovePhoto.
  ///
  /// In ru, this message translates to:
  /// **'Удалить фото'**
  String get profileEditRemovePhoto;

  /// No description provided for @profileEditAvatarUpdated.
  ///
  /// In ru, this message translates to:
  /// **'Фото обновлено'**
  String get profileEditAvatarUpdated;

  /// No description provided for @profileEditAvatarRemoved.
  ///
  /// In ru, this message translates to:
  /// **'Фото удалено'**
  String get profileEditAvatarRemoved;

  /// No description provided for @profileEditAvatarFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить фото'**
  String get profileEditAvatarFailed;

  /// No description provided for @businessRoute.
  ///
  /// In ru, this message translates to:
  /// **'Маршрут'**
  String get businessRoute;

  /// No description provided for @businessWebsite.
  ///
  /// In ru, this message translates to:
  /// **'Сайт'**
  String get businessWebsite;

  /// No description provided for @businessShare.
  ///
  /// In ru, this message translates to:
  /// **'Поделиться'**
  String get businessShare;

  /// No description provided for @businessReviews.
  ///
  /// In ru, this message translates to:
  /// **'Отзывы'**
  String get businessReviews;

  /// No description provided for @businessWriteReview.
  ///
  /// In ru, this message translates to:
  /// **'Написать отзыв'**
  String get businessWriteReview;

  /// No description provided for @businessOpen.
  ///
  /// In ru, this message translates to:
  /// **'Открыто'**
  String get businessOpen;

  /// No description provided for @businessClosed.
  ///
  /// In ru, this message translates to:
  /// **'Закрыто'**
  String get businessClosed;

  /// No description provided for @businessToday.
  ///
  /// In ru, this message translates to:
  /// **'Сегодня'**
  String get businessToday;

  /// No description provided for @businessPromotions.
  ///
  /// In ru, this message translates to:
  /// **'Акции'**
  String get businessPromotions;

  /// No description provided for @businessInstagram.
  ///
  /// In ru, this message translates to:
  /// **'Instagram'**
  String get businessInstagram;

  /// No description provided for @businessAddress.
  ///
  /// In ru, this message translates to:
  /// **'Адрес'**
  String get businessAddress;

  /// No description provided for @catalogNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Ничего не найдено'**
  String get catalogNotFound;

  /// No description provided for @onboardingForBusinessTitle.
  ///
  /// In ru, this message translates to:
  /// **'Для бизнеса'**
  String get onboardingForBusinessTitle;

  /// No description provided for @onboardingIntro.
  ///
  /// In ru, this message translates to:
  /// **'Добавьте или найдите свой бизнес. Если он уже есть в QalaGo, запросите доступ вместо создания новой карточки.'**
  String get onboardingIntro;

  /// No description provided for @onboardingSearchLabel.
  ///
  /// In ru, this message translates to:
  /// **'Название или адрес'**
  String get onboardingSearchLabel;

  /// No description provided for @onboardingSearchAction.
  ///
  /// In ru, this message translates to:
  /// **'Искать'**
  String get onboardingSearchAction;

  /// No description provided for @onboardingSearching.
  ///
  /// In ru, this message translates to:
  /// **'Поиск…'**
  String get onboardingSearching;

  /// No description provided for @onboardingApplyIntro.
  ///
  /// In ru, this message translates to:
  /// **'Заявка будет проверена администрацией QalaGo. Доступ к кабинету появится после одобрения.'**
  String get onboardingApplyIntro;

  /// No description provided for @onboardingNameLabel.
  ///
  /// In ru, this message translates to:
  /// **'Название *'**
  String get onboardingNameLabel;

  /// No description provided for @onboardingNameRequired.
  ///
  /// In ru, this message translates to:
  /// **'Введите название'**
  String get onboardingNameRequired;

  /// No description provided for @onboardingCategoryLabel.
  ///
  /// In ru, this message translates to:
  /// **'Категория *'**
  String get onboardingCategoryLabel;

  /// No description provided for @onboardingAddressLabel.
  ///
  /// In ru, this message translates to:
  /// **'Адрес *'**
  String get onboardingAddressLabel;

  /// No description provided for @onboardingAddressRequired.
  ///
  /// In ru, this message translates to:
  /// **'Введите адрес'**
  String get onboardingAddressRequired;

  /// No description provided for @onboardingPhoneLabel.
  ///
  /// In ru, this message translates to:
  /// **'Телефон'**
  String get onboardingPhoneLabel;

  /// No description provided for @onboardingDescriptionLabel.
  ///
  /// In ru, this message translates to:
  /// **'Краткое описание'**
  String get onboardingDescriptionLabel;

  /// No description provided for @onboardingSaveDraft.
  ///
  /// In ru, this message translates to:
  /// **'Сохранить черновик'**
  String get onboardingSaveDraft;

  /// No description provided for @onboardingSubmitReview.
  ///
  /// In ru, this message translates to:
  /// **'Отправить на проверку'**
  String get onboardingSubmitReview;

  /// No description provided for @onboardingSaving.
  ///
  /// In ru, this message translates to:
  /// **'Сохранение…'**
  String get onboardingSaving;

  /// No description provided for @onboardingSubmitting.
  ///
  /// In ru, this message translates to:
  /// **'Отправка…'**
  String get onboardingSubmitting;

  /// No description provided for @onboardingSubmitted.
  ///
  /// In ru, this message translates to:
  /// **'Заявка отправлена на проверку'**
  String get onboardingSubmitted;

  /// No description provided for @onboardingClaimSentTitle.
  ///
  /// In ru, this message translates to:
  /// **'Заявка отправлена'**
  String get onboardingClaimSentTitle;

  /// No description provided for @onboardingClaimSentBody.
  ///
  /// In ru, this message translates to:
  /// **'Мы сообщим о результате после проверки.'**
  String get onboardingClaimSentBody;

  /// No description provided for @onboardingClaimTitle.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердить права владельца'**
  String get onboardingClaimTitle;

  /// No description provided for @onboardingClaimIntro.
  ///
  /// In ru, this message translates to:
  /// **'Заявка будет проверена администрацией QalaGo.'**
  String get onboardingClaimIntro;

  /// No description provided for @onboardingClaimMessageLabel.
  ///
  /// In ru, this message translates to:
  /// **'Сообщение для модератора (необязательно)'**
  String get onboardingClaimMessageLabel;

  /// No description provided for @onboardingClaimSubmit.
  ///
  /// In ru, this message translates to:
  /// **'Отправить заявку'**
  String get onboardingClaimSubmit;

  /// No description provided for @onboardingClaimsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Подтверждение прав'**
  String get onboardingClaimsTitle;

  /// No description provided for @onboardingClaimsEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Заявок на подтверждение пока нет'**
  String get onboardingClaimsEmpty;

  /// No description provided for @onboardingApplicationsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Мои заявки'**
  String get onboardingApplicationsTitle;

  /// No description provided for @onboardingApplicationsEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Заявок пока нет'**
  String get onboardingApplicationsEmpty;

  /// No description provided for @onboardingAddBusinessBtn.
  ///
  /// In ru, this message translates to:
  /// **'Добавить бизнес'**
  String get onboardingAddBusinessBtn;

  /// No description provided for @onboardingReasonPrefix.
  ///
  /// In ru, this message translates to:
  /// **'Причина: {reason}'**
  String onboardingReasonPrefix(String reason);

  /// No description provided for @onboardingStatusDraft.
  ///
  /// In ru, this message translates to:
  /// **'Черновик'**
  String get onboardingStatusDraft;

  /// No description provided for @onboardingStatusPending.
  ///
  /// In ru, this message translates to:
  /// **'На проверке'**
  String get onboardingStatusPending;

  /// No description provided for @onboardingStatusApproved.
  ///
  /// In ru, this message translates to:
  /// **'Одобрено'**
  String get onboardingStatusApproved;

  /// No description provided for @onboardingStatusRejected.
  ///
  /// In ru, this message translates to:
  /// **'Отклонено'**
  String get onboardingStatusRejected;

  /// No description provided for @onboardingStatusCancelled.
  ///
  /// In ru, this message translates to:
  /// **'Отменено'**
  String get onboardingStatusCancelled;

  /// No description provided for @onboardingRoleOwner.
  ///
  /// In ru, this message translates to:
  /// **'Владелец'**
  String get onboardingRoleOwner;

  /// No description provided for @onboardingRoleManager.
  ///
  /// In ru, this message translates to:
  /// **'Менеджер'**
  String get onboardingRoleManager;

  /// No description provided for @onboardingErrorConflict.
  ///
  /// In ru, this message translates to:
  /// **'Заявка уже отправлена или статус изменился. Обновите страницу.'**
  String get onboardingErrorConflict;

  /// No description provided for @onboardingErrorDuplicate.
  ///
  /// In ru, this message translates to:
  /// **'Похожий бизнес уже есть в QalaGo. Попробуйте найти существующий.'**
  String get onboardingErrorDuplicate;

  /// No description provided for @onboardingErrorAlreadyOwner.
  ///
  /// In ru, this message translates to:
  /// **'У вас уже есть права владельца этого бизнеса.'**
  String get onboardingErrorAlreadyOwner;

  /// No description provided for @onboardingErrorForbidden.
  ///
  /// In ru, this message translates to:
  /// **'Доступ ограничен. Обратитесь к администратору.'**
  String get onboardingErrorForbidden;

  /// No description provided for @onboardingErrorGeneric.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось выполнить действие. Попробуйте ещё раз.'**
  String get onboardingErrorGeneric;

  /// No description provided for @claimCtaLoginTitle.
  ///
  /// In ru, this message translates to:
  /// **'Войдите'**
  String get claimCtaLoginTitle;

  /// No description provided for @claimCtaLoginMessage.
  ///
  /// In ru, this message translates to:
  /// **'Чтобы подтвердить права владельца, войдите в аккаунт.'**
  String get claimCtaLoginMessage;

  /// No description provided for @claimCtaYourBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Это ваш бизнес?'**
  String get claimCtaYourBusiness;

  /// No description provided for @claimCtaPending.
  ///
  /// In ru, this message translates to:
  /// **'Заявка на подтверждении'**
  String get claimCtaPending;

  /// No description provided for @claimCtaConfirmOwner.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердить права владельца'**
  String get claimCtaConfirmOwner;

  /// No description provided for @defaultSearchHint.
  ///
  /// In ru, this message translates to:
  /// **'Поиск...'**
  String get defaultSearchHint;

  /// No description provided for @errorInvalidOtp.
  ///
  /// In ru, this message translates to:
  /// **'Неверный код'**
  String get errorInvalidOtp;

  /// No description provided for @errorUnauthorized.
  ///
  /// In ru, this message translates to:
  /// **'Требуется вход'**
  String get errorUnauthorized;

  /// No description provided for @errorForbidden.
  ///
  /// In ru, this message translates to:
  /// **'Недостаточно прав'**
  String get errorForbidden;

  /// No description provided for @errorNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Не найдено'**
  String get errorNotFound;

  /// No description provided for @errorNetwork.
  ///
  /// In ru, this message translates to:
  /// **'Проверьте подключение к интернету'**
  String get errorNetwork;

  /// No description provided for @errorTimeout.
  ///
  /// In ru, this message translates to:
  /// **'Превышено время ожидания'**
  String get errorTimeout;

  /// No description provided for @errorRateLimited.
  ///
  /// In ru, this message translates to:
  /// **'Слишком много попыток. Попробуйте позже'**
  String get errorRateLimited;

  /// No description provided for @errorLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить данные. Проверьте подключение и попробуйте снова.'**
  String get errorLoadFailed;

  /// No description provided for @errorServiceUnavailable.
  ///
  /// In ru, this message translates to:
  /// **'Сервис временно недоступен. Попробуйте позже.'**
  String get errorServiceUnavailable;

  /// No description provided for @deleteAccountButton.
  ///
  /// In ru, this message translates to:
  /// **'Удалить аккаунт'**
  String get deleteAccountButton;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In ru, this message translates to:
  /// **'Удалить аккаунт?'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountBody.
  ///
  /// In ru, this message translates to:
  /// **'Это действие необратимо. Будут удалены избранное, отзывы и доступ к заведениям. Если вы единственный владелец бизнеса, сначала передайте управление.'**
  String get deleteAccountBody;

  /// No description provided for @deleteAccountConfirmTitle.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердите удаление'**
  String get deleteAccountConfirmTitle;

  /// No description provided for @deleteAccountConfirmBody.
  ///
  /// In ru, this message translates to:
  /// **'Аккаунт будет удалён без возможности восстановления.'**
  String get deleteAccountConfirmBody;

  /// No description provided for @deleteAccountSuccess.
  ///
  /// In ru, this message translates to:
  /// **'Аккаунт удалён'**
  String get deleteAccountSuccess;

  /// No description provided for @deleteAccountConflict.
  ///
  /// In ru, this message translates to:
  /// **'Перед удалением передайте управление заведением другому владельцу.'**
  String get deleteAccountConflict;

  /// No description provided for @deleteAccountFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось удалить аккаунт. Попробуйте позже.'**
  String get deleteAccountFailed;

  /// No description provided for @reviewsCount.
  ///
  /// In ru, this message translates to:
  /// **'{count, plural, =0{0 отзывов} one{{count} отзыв} few{{count} отзыва} many{{count} отзывов} other{{count} отзыва}}'**
  String reviewsCount(int count);

  /// No description provided for @placesCount.
  ///
  /// In ru, this message translates to:
  /// **'{count, plural, =0{0 мест} one{{count} место} few{{count} места} many{{count} мест} other{{count} места}}'**
  String placesCount(int count);

  /// No description provided for @ownerPlanTierFree.
  ///
  /// In ru, this message translates to:
  /// **'Бесплатный'**
  String get ownerPlanTierFree;

  /// No description provided for @ownerPlanTierBasic.
  ///
  /// In ru, this message translates to:
  /// **'Бизнес'**
  String get ownerPlanTierBasic;

  /// No description provided for @ownerPlanTierPremium.
  ///
  /// In ru, this message translates to:
  /// **'PRO'**
  String get ownerPlanTierPremium;

  /// No description provided for @ownerPlanTierVip.
  ///
  /// In ru, this message translates to:
  /// **'VIP'**
  String get ownerPlanTierVip;

  /// No description provided for @ownerStatusActive.
  ///
  /// In ru, this message translates to:
  /// **'Активен'**
  String get ownerStatusActive;

  /// No description provided for @ownerStatusPendingModeration.
  ///
  /// In ru, this message translates to:
  /// **'На модерации'**
  String get ownerStatusPendingModeration;

  /// No description provided for @ownerStatusBlocked.
  ///
  /// In ru, this message translates to:
  /// **'Заблокирован'**
  String get ownerStatusBlocked;

  /// No description provided for @ownerPromotionStatusActive.
  ///
  /// In ru, this message translates to:
  /// **'Активна'**
  String get ownerPromotionStatusActive;

  /// No description provided for @ownerPromotionStatusExpired.
  ///
  /// In ru, this message translates to:
  /// **'Истекла'**
  String get ownerPromotionStatusExpired;

  /// No description provided for @ownerPromotionFeedHint.
  ///
  /// In ru, this message translates to:
  /// **'Продвижение в ленте города — через рекламные продукты'**
  String get ownerPromotionFeedHint;

  /// No description provided for @ownerNotificationReviewNew.
  ///
  /// In ru, this message translates to:
  /// **'Новый отзыв'**
  String get ownerNotificationReviewNew;

  /// No description provided for @ownerNotificationReviewReply.
  ///
  /// In ru, this message translates to:
  /// **'Ответ на отзыв'**
  String get ownerNotificationReviewReply;

  /// No description provided for @ownerNotificationModeration.
  ///
  /// In ru, this message translates to:
  /// **'Модерация'**
  String get ownerNotificationModeration;

  /// No description provided for @ownerNotificationPromotion.
  ///
  /// In ru, this message translates to:
  /// **'Акция'**
  String get ownerNotificationPromotion;

  /// No description provided for @ownerNotificationPlan.
  ///
  /// In ru, this message translates to:
  /// **'Тариф'**
  String get ownerNotificationPlan;

  /// No description provided for @ownerNotificationGeneral.
  ///
  /// In ru, this message translates to:
  /// **'Общее'**
  String get ownerNotificationGeneral;

  /// No description provided for @ownerKpiViews.
  ///
  /// In ru, this message translates to:
  /// **'Просмотры'**
  String get ownerKpiViews;

  /// No description provided for @ownerKpiCalls.
  ///
  /// In ru, this message translates to:
  /// **'Звонки'**
  String get ownerKpiCalls;

  /// No description provided for @ownerKpiRoutes.
  ///
  /// In ru, this message translates to:
  /// **'Маршруты'**
  String get ownerKpiRoutes;

  /// No description provided for @ownerKpiFavorites.
  ///
  /// In ru, this message translates to:
  /// **'Избранное'**
  String get ownerKpiFavorites;

  /// No description provided for @ownerAnalyticsFavorites.
  ///
  /// In ru, this message translates to:
  /// **'В избранное'**
  String get ownerAnalyticsFavorites;

  /// No description provided for @ownerAnalyticsDeltaPositive.
  ///
  /// In ru, this message translates to:
  /// **'+{percent}% к предыдущему периоду'**
  String ownerAnalyticsDeltaPositive(int percent);

  /// No description provided for @ownerAnalyticsDeltaNegative.
  ///
  /// In ru, this message translates to:
  /// **'{percent}% к предыдущему периоду'**
  String ownerAnalyticsDeltaNegative(int percent);

  /// No description provided for @ownerAnalyticsDeltaZero.
  ///
  /// In ru, this message translates to:
  /// **'0% к предыдущему периоду'**
  String get ownerAnalyticsDeltaZero;

  /// No description provided for @ownerAnalyticsUpgradeActions.
  ///
  /// In ru, this message translates to:
  /// **'Доступно в тарифе Бизнес'**
  String get ownerAnalyticsUpgradeActions;

  /// No description provided for @ownerAnalyticsUpgradeSources.
  ///
  /// In ru, this message translates to:
  /// **'Источники, поисковые запросы и CTR доступны в PRO'**
  String get ownerAnalyticsUpgradeSources;

  /// No description provided for @ownerAnalyticsUpgradeAudience.
  ///
  /// In ru, this message translates to:
  /// **'Analytics 360 доступна в VIP'**
  String get ownerAnalyticsUpgradeAudience;

  /// No description provided for @ownerPermissionProfileEdit.
  ///
  /// In ru, this message translates to:
  /// **'Редактирование профиля'**
  String get ownerPermissionProfileEdit;

  /// No description provided for @ownerPermissionHoursEdit.
  ///
  /// In ru, this message translates to:
  /// **'График работы'**
  String get ownerPermissionHoursEdit;

  /// No description provided for @ownerPermissionCatalogEdit.
  ///
  /// In ru, this message translates to:
  /// **'Товары и услуги'**
  String get ownerPermissionCatalogEdit;

  /// No description provided for @ownerPermissionPhotosEdit.
  ///
  /// In ru, this message translates to:
  /// **'Фото и галерея'**
  String get ownerPermissionPhotosEdit;

  /// No description provided for @ownerPermissionPromotionsEdit.
  ///
  /// In ru, this message translates to:
  /// **'Акции'**
  String get ownerPermissionPromotionsEdit;

  /// No description provided for @ownerPermissionReviewsReply.
  ///
  /// In ru, this message translates to:
  /// **'Ответы на отзывы'**
  String get ownerPermissionReviewsReply;

  /// No description provided for @ownerPermissionAnalyticsView.
  ///
  /// In ru, this message translates to:
  /// **'Просмотр статистики'**
  String get ownerPermissionAnalyticsView;

  /// No description provided for @ownerPermissionAnalyticsExport.
  ///
  /// In ru, this message translates to:
  /// **'Экспорт статистики'**
  String get ownerPermissionAnalyticsExport;

  /// No description provided for @ownerPermissionAdsManage.
  ///
  /// In ru, this message translates to:
  /// **'Реклама и продвижение'**
  String get ownerPermissionAdsManage;

  /// No description provided for @ownerPermissionPaymentsView.
  ///
  /// In ru, this message translates to:
  /// **'Просмотр платежей'**
  String get ownerPermissionPaymentsView;

  /// No description provided for @ownerMembershipStatusActive.
  ///
  /// In ru, this message translates to:
  /// **'Активен'**
  String get ownerMembershipStatusActive;

  /// No description provided for @ownerMembershipStatusSuspended.
  ///
  /// In ru, this message translates to:
  /// **'Приостановлен'**
  String get ownerMembershipStatusSuspended;

  /// No description provided for @ownerMembershipStatusRevoked.
  ///
  /// In ru, this message translates to:
  /// **'Доступ отозван'**
  String get ownerMembershipStatusRevoked;

  /// No description provided for @ownerMembershipStatusInvited.
  ///
  /// In ru, this message translates to:
  /// **'Приглашён'**
  String get ownerMembershipStatusInvited;

  /// No description provided for @ownerPresetManager.
  ///
  /// In ru, this message translates to:
  /// **'Управляющий'**
  String get ownerPresetManager;

  /// No description provided for @ownerPresetManagerDesc.
  ///
  /// In ru, this message translates to:
  /// **'Операционный доступ без управления командой'**
  String get ownerPresetManagerDesc;

  /// No description provided for @ownerPresetContent.
  ///
  /// In ru, this message translates to:
  /// **'Контент-менеджер'**
  String get ownerPresetContent;

  /// No description provided for @ownerPresetContentDesc.
  ///
  /// In ru, this message translates to:
  /// **'Профиль, каталог, фото и акции'**
  String get ownerPresetContentDesc;

  /// No description provided for @ownerPresetMarketing.
  ///
  /// In ru, this message translates to:
  /// **'Маркетолог'**
  String get ownerPresetMarketing;

  /// No description provided for @ownerPresetMarketingDesc.
  ///
  /// In ru, this message translates to:
  /// **'Акции, реклама и базовая аналитика'**
  String get ownerPresetMarketingDesc;

  /// No description provided for @ownerPresetAnalytics.
  ///
  /// In ru, this message translates to:
  /// **'Аналитик'**
  String get ownerPresetAnalytics;

  /// No description provided for @ownerPresetAnalyticsDesc.
  ///
  /// In ru, this message translates to:
  /// **'Просмотр и экспорт статистики'**
  String get ownerPresetAnalyticsDesc;

  /// No description provided for @ownerPermissionsMore.
  ///
  /// In ru, this message translates to:
  /// **'{head} · +{count}'**
  String ownerPermissionsMore(String head, int count);

  /// No description provided for @monetizationProductBoost.
  ///
  /// In ru, this message translates to:
  /// **'Поднять карточку'**
  String get monetizationProductBoost;

  /// No description provided for @monetizationProductTopCategory.
  ///
  /// In ru, this message translates to:
  /// **'TOP категории'**
  String get monetizationProductTopCategory;

  /// No description provided for @monetizationProductPromotedPromotion.
  ///
  /// In ru, this message translates to:
  /// **'Продвинуть акцию'**
  String get monetizationProductPromotedPromotion;

  /// No description provided for @monetizationProductFeaturedBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Популярное место'**
  String get monetizationProductFeaturedBusiness;

  /// No description provided for @monetizationProductVipBanner.
  ///
  /// In ru, this message translates to:
  /// **'VIP-баннер'**
  String get monetizationProductVipBanner;

  /// No description provided for @monetizationProductBoostDesc.
  ///
  /// In ru, this message translates to:
  /// **'Дополнительная видимость вашего бизнеса в категории.'**
  String get monetizationProductBoostDesc;

  /// No description provided for @monetizationProductTopCategoryDesc.
  ///
  /// In ru, this message translates to:
  /// **'Ваш бизнес показывается в приоритетном рекламном блоке своей категории.'**
  String get monetizationProductTopCategoryDesc;

  /// No description provided for @monetizationProductPromotedPromotionDesc.
  ///
  /// In ru, this message translates to:
  /// **'Ваша акция получает дополнительное рекламное размещение в QalaGo.'**
  String get monetizationProductPromotedPromotionDesc;

  /// No description provided for @monetizationProductFeaturedBusinessDesc.
  ///
  /// In ru, this message translates to:
  /// **'Ваш бизнес получает дополнительное размещение на главной странице.'**
  String get monetizationProductFeaturedBusinessDesc;

  /// No description provided for @monetizationProductVipBannerDesc.
  ///
  /// In ru, this message translates to:
  /// **'Большой рекламный баннер на главной странице QalaGo.'**
  String get monetizationProductVipBannerDesc;

  /// No description provided for @monetizationProductDefaultDesc.
  ///
  /// In ru, this message translates to:
  /// **'Рекламное размещение в QalaGo.'**
  String get monetizationProductDefaultDesc;

  /// No description provided for @monetizationProductTopCategoryNote.
  ///
  /// In ru, this message translates to:
  /// **'Позиции распределяются автоматически между активными рекламодателями.'**
  String get monetizationProductTopCategoryNote;

  /// No description provided for @monetizationOrderAwaitingPayment.
  ///
  /// In ru, this message translates to:
  /// **'Ожидает оплаты'**
  String get monetizationOrderAwaitingPayment;

  /// No description provided for @monetizationOrderPaid.
  ///
  /// In ru, this message translates to:
  /// **'Оплачен'**
  String get monetizationOrderPaid;

  /// No description provided for @monetizationOrderRefunded.
  ///
  /// In ru, this message translates to:
  /// **'Возврат'**
  String get monetizationOrderRefunded;

  /// No description provided for @monetizationOrderPartialRefund.
  ///
  /// In ru, this message translates to:
  /// **'Частичный возврат'**
  String get monetizationOrderPartialRefund;

  /// No description provided for @monetizationCampaignPendingModeration.
  ///
  /// In ru, this message translates to:
  /// **'На модерации'**
  String get monetizationCampaignPendingModeration;

  /// No description provided for @monetizationCampaignScheduled.
  ///
  /// In ru, this message translates to:
  /// **'Запланирована'**
  String get monetizationCampaignScheduled;

  /// No description provided for @monetizationCampaignPaused.
  ///
  /// In ru, this message translates to:
  /// **'Приостановлено'**
  String get monetizationCampaignPaused;

  /// No description provided for @monetizationCampaignCompleted.
  ///
  /// In ru, this message translates to:
  /// **'Завершено'**
  String get monetizationCampaignCompleted;

  /// No description provided for @monetizationCreativePending.
  ///
  /// In ru, this message translates to:
  /// **'На проверке'**
  String get monetizationCreativePending;

  /// No description provided for @monetizationCreativeApproved.
  ///
  /// In ru, this message translates to:
  /// **'Одобрен'**
  String get monetizationCreativeApproved;

  /// No description provided for @monetizationAnalyticsCardOpen.
  ///
  /// In ru, this message translates to:
  /// **'Открытия карточки'**
  String get monetizationAnalyticsCardOpen;

  /// No description provided for @monetizationAnalyticsPromotionOpen.
  ///
  /// In ru, this message translates to:
  /// **'Открытия акции'**
  String get monetizationAnalyticsPromotionOpen;

  /// No description provided for @monetizationPurchaseAvailable.
  ///
  /// In ru, this message translates to:
  /// **'Доступно'**
  String get monetizationPurchaseAvailable;

  /// No description provided for @monetizationPurchaseActive.
  ///
  /// In ru, this message translates to:
  /// **'Активно'**
  String get monetizationPurchaseActive;

  /// No description provided for @monetizationPurchaseSoldOut.
  ///
  /// In ru, this message translates to:
  /// **'Мест нет'**
  String get monetizationPurchaseSoldOut;

  /// No description provided for @monetizationActionBuy.
  ///
  /// In ru, this message translates to:
  /// **'Купить'**
  String get monetizationActionBuy;

  /// No description provided for @monetizationActionContinuePayment.
  ///
  /// In ru, this message translates to:
  /// **'Продолжить оплату'**
  String get monetizationActionContinuePayment;

  /// No description provided for @monetizationActionRenew.
  ///
  /// In ru, this message translates to:
  /// **'Продлить'**
  String get monetizationActionRenew;

  /// No description provided for @monetizationReasonPendingOrder.
  ///
  /// In ru, this message translates to:
  /// **'У вас уже есть неоплаченный заказ на это размещение.'**
  String get monetizationReasonPendingOrder;

  /// No description provided for @monetizationReasonConflict.
  ///
  /// In ru, this message translates to:
  /// **'Размещение конфликтует с текущим графиком.'**
  String get monetizationReasonConflict;

  /// No description provided for @monetizationReasonAlreadyActive.
  ///
  /// In ru, this message translates to:
  /// **'Размещение уже активно.'**
  String get monetizationReasonAlreadyActive;

  /// No description provided for @monetizationReasonAlreadyScheduled.
  ///
  /// In ru, this message translates to:
  /// **'Размещение уже запланировано.'**
  String get monetizationReasonAlreadyScheduled;

  /// No description provided for @monetizationReasonTargetPromoted.
  ///
  /// In ru, this message translates to:
  /// **'Эта акция уже продвигается.'**
  String get monetizationReasonTargetPromoted;

  /// No description provided for @monetizationReasonCategoryIneligible.
  ///
  /// In ru, this message translates to:
  /// **'Категория не подходит для этого продукта.'**
  String get monetizationReasonCategoryIneligible;

  /// No description provided for @monetizationReasonPromotionIneligible.
  ///
  /// In ru, this message translates to:
  /// **'Акция недоступна для продвижения.'**
  String get monetizationReasonPromotionIneligible;

  /// No description provided for @monetizationReasonSoldOut.
  ///
  /// In ru, this message translates to:
  /// **'Свободных мест нет на выбранный период.'**
  String get monetizationReasonSoldOut;

  /// No description provided for @monetizationReasonPackageConflict.
  ///
  /// In ru, this message translates to:
  /// **'Компоненты пакета не укладываются в доступные слоты.'**
  String get monetizationReasonPackageConflict;

  /// No description provided for @monetizationReasonReservationExpired.
  ///
  /// In ru, this message translates to:
  /// **'Резерв места истёк — обновите статус и попробуйте снова.'**
  String get monetizationReasonReservationExpired;

  /// No description provided for @monetizationReasonGeneric.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось выполнить операцию.'**
  String get monetizationReasonGeneric;

  /// No description provided for @monetizationReasonGenericWithCode.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось выполнить операцию ({code}).'**
  String monetizationReasonGenericWithCode(String code);

  /// No description provided for @monetizationVipModerationNotice.
  ///
  /// In ru, this message translates to:
  /// **'VIP-баннер будет опубликован после проверки модератором. Оплаченный период начнётся только после одобрения баннера.'**
  String get monetizationVipModerationNotice;

  /// No description provided for @monetizationPackageVipNotice.
  ///
  /// In ru, this message translates to:
  /// **'Пакет включает VIP-баннер. Для запуска VIP-размещения необходимо настроить баннер и пройти модерацию.'**
  String get monetizationPackageVipNotice;

  /// No description provided for @monetizationPackageVipCta.
  ///
  /// In ru, this message translates to:
  /// **'Настроить VIP-баннер'**
  String get monetizationPackageVipCta;

  /// No description provided for @monetizationPaymentInfoNotice.
  ///
  /// In ru, this message translates to:
  /// **'После подтверждения оплаты продвижение будет активировано автоматически.'**
  String get monetizationPaymentInfoNotice;

  /// No description provided for @monetizationPaymentMethodUnavailable.
  ///
  /// In ru, this message translates to:
  /// **'Способ оплаты будет доступен после подключения платёжного сервиса.'**
  String get monetizationPaymentMethodUnavailable;

  /// No description provided for @monetizationCtrTooltip.
  ///
  /// In ru, this message translates to:
  /// **'CTR — доля переходов от количества засчитанных просмотров рекламы.'**
  String get monetizationCtrTooltip;

  /// No description provided for @ownerInvitationStatusPending.
  ///
  /// In ru, this message translates to:
  /// **'Приглашение активно'**
  String get ownerInvitationStatusPending;

  /// No description provided for @ownerInvitationStatusAccepted.
  ///
  /// In ru, this message translates to:
  /// **'Приглашение уже принято'**
  String get ownerInvitationStatusAccepted;

  /// No description provided for @ownerInvitationStatusRevoked.
  ///
  /// In ru, this message translates to:
  /// **'Приглашение отозвано'**
  String get ownerInvitationStatusRevoked;

  /// No description provided for @ownerInvitationStatusExpired.
  ///
  /// In ru, this message translates to:
  /// **'Срок приглашения истёк'**
  String get ownerInvitationStatusExpired;

  /// No description provided for @ownerDurationDays.
  ///
  /// In ru, this message translates to:
  /// **'{count} {unit}'**
  String ownerDurationDays(int count, String unit);

  /// No description provided for @ownerDurationHours.
  ///
  /// In ru, this message translates to:
  /// **'{count} ч'**
  String ownerDurationHours(int count);

  /// No description provided for @ownerDayUnitOne.
  ///
  /// In ru, this message translates to:
  /// **'день'**
  String get ownerDayUnitOne;

  /// No description provided for @ownerDayUnitFew.
  ///
  /// In ru, this message translates to:
  /// **'дня'**
  String get ownerDayUnitFew;

  /// No description provided for @ownerDayUnitMany.
  ///
  /// In ru, this message translates to:
  /// **'дней'**
  String get ownerDayUnitMany;

  /// No description provided for @ownerNavOverview.
  ///
  /// In ru, this message translates to:
  /// **'Обзор'**
  String get ownerNavOverview;

  /// No description provided for @ownerNavAnalytics.
  ///
  /// In ru, this message translates to:
  /// **'Статистика'**
  String get ownerNavAnalytics;

  /// No description provided for @ownerNavPromote.
  ///
  /// In ru, this message translates to:
  /// **'Реклама и продвижение'**
  String get ownerNavPromote;

  /// No description provided for @ownerNavMessages.
  ///
  /// In ru, this message translates to:
  /// **'Сообщения'**
  String get ownerNavMessages;

  /// No description provided for @ownerNavPlan.
  ///
  /// In ru, this message translates to:
  /// **'Тариф'**
  String get ownerNavPlan;

  /// No description provided for @ownerNavTeam.
  ///
  /// In ru, this message translates to:
  /// **'Команда'**
  String get ownerNavTeam;

  /// No description provided for @ownerNavSettings.
  ///
  /// In ru, this message translates to:
  /// **'Настройки'**
  String get ownerNavSettings;

  /// No description provided for @ownerNavHelp.
  ///
  /// In ru, this message translates to:
  /// **'Помощь'**
  String get ownerNavHelp;

  /// No description provided for @ownerNavBackToApp.
  ///
  /// In ru, this message translates to:
  /// **'В приложение QalaGo'**
  String get ownerNavBackToApp;

  /// No description provided for @ownerBusinessDrawerTitle.
  ///
  /// In ru, this message translates to:
  /// **'QalaGo Business'**
  String get ownerBusinessDrawerTitle;

  /// No description provided for @ownerDashboardTitle.
  ///
  /// In ru, this message translates to:
  /// **'Кабинет бизнеса'**
  String get ownerDashboardTitle;

  /// No description provided for @ownerAddBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Добавить'**
  String get ownerAddBusiness;

  /// No description provided for @ownerBusinessLabel.
  ///
  /// In ru, this message translates to:
  /// **'Заведение'**
  String get ownerBusinessLabel;

  /// No description provided for @ownerWelcome.
  ///
  /// In ru, this message translates to:
  /// **'Добро пожаловать, {title}!'**
  String ownerWelcome(String title);

  /// No description provided for @ownerNoBusinessesTitle.
  ///
  /// In ru, this message translates to:
  /// **'Нет заведений'**
  String get ownerNoBusinessesTitle;

  /// No description provided for @ownerNoBusinessesBody.
  ///
  /// In ru, this message translates to:
  /// **'Зарегистрируйте заведение — после модерации оно появится в QalaGo.'**
  String get ownerNoBusinessesBody;

  /// No description provided for @ownerRegisterBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Зарегистрировать заведение'**
  String get ownerRegisterBusiness;

  /// No description provided for @ownerSummaryWeek.
  ///
  /// In ru, this message translates to:
  /// **'{views} просмотров · {actions} действий за 7 дней'**
  String ownerSummaryWeek(int views, int actions);

  /// No description provided for @ownerDeltaWeek.
  ///
  /// In ru, this message translates to:
  /// **'{delta} за нед.'**
  String ownerDeltaWeek(String delta);

  /// No description provided for @ownerViewsChartTitle.
  ///
  /// In ru, this message translates to:
  /// **'Просмотры за 7 дней'**
  String get ownerViewsChartTitle;

  /// No description provided for @ownerTrendsLockedHint.
  ///
  /// In ru, this message translates to:
  /// **'График действий по дням доступен на тарифе «Бизнес» и выше.'**
  String get ownerTrendsLockedHint;

  /// No description provided for @ownerPlanUsageTitle.
  ///
  /// In ru, this message translates to:
  /// **'Использование тарифа'**
  String get ownerPlanUsageTitle;

  /// No description provided for @ownerProfileCard.
  ///
  /// In ru, this message translates to:
  /// **'Профиль'**
  String get ownerProfileCard;

  /// No description provided for @ownerProfileCompletion.
  ///
  /// In ru, this message translates to:
  /// **'{percent}% заполнено'**
  String ownerProfileCompletion(int percent);

  /// No description provided for @ownerFillProfile.
  ///
  /// In ru, this message translates to:
  /// **'Заполнить'**
  String get ownerFillProfile;

  /// No description provided for @ownerUpgradePlan.
  ///
  /// In ru, this message translates to:
  /// **'Улучшить'**
  String get ownerUpgradePlan;

  /// No description provided for @ownerActivePromotions.
  ///
  /// In ru, this message translates to:
  /// **'Активные акции'**
  String get ownerActivePromotions;

  /// No description provided for @ownerNoActivePromotions.
  ///
  /// In ru, this message translates to:
  /// **'Нет активных акций'**
  String get ownerNoActivePromotions;

  /// No description provided for @ownerPromoteCatalogSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'VIP-баннер, TOP категории, продвижение акций и пакеты'**
  String get ownerPromoteCatalogSubtitle;

  /// No description provided for @ownerOpenCatalog.
  ///
  /// In ru, this message translates to:
  /// **'Открыть каталог'**
  String get ownerOpenCatalog;

  /// No description provided for @ownerMyCampaigns.
  ///
  /// In ru, this message translates to:
  /// **'Мои кампании'**
  String get ownerMyCampaigns;

  /// No description provided for @ownerManagementSection.
  ///
  /// In ru, this message translates to:
  /// **'Управление'**
  String get ownerManagementSection;

  /// No description provided for @ownerPreviewCard.
  ///
  /// In ru, this message translates to:
  /// **'Предпросмотр карточки'**
  String get ownerPreviewCard;

  /// No description provided for @ownerMgmtMyBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Мой бизнес'**
  String get ownerMgmtMyBusiness;

  /// No description provided for @ownerMgmtGallery.
  ///
  /// In ru, this message translates to:
  /// **'Галерея'**
  String get ownerMgmtGallery;

  /// No description provided for @ownerMgmtPromotions.
  ///
  /// In ru, this message translates to:
  /// **'Акции'**
  String get ownerMgmtPromotions;

  /// No description provided for @ownerMgmtReviews.
  ///
  /// In ru, this message translates to:
  /// **'Отзывы'**
  String get ownerMgmtReviews;

  /// No description provided for @ownerErrorWithDetails.
  ///
  /// In ru, this message translates to:
  /// **'Ошибка: {details}'**
  String ownerErrorWithDetails(String details);

  /// No description provided for @ownerSaving.
  ///
  /// In ru, this message translates to:
  /// **'Сохранение…'**
  String get ownerSaving;

  /// No description provided for @ownerSubmitting.
  ///
  /// In ru, this message translates to:
  /// **'Отправка…'**
  String get ownerSubmitting;

  /// No description provided for @ownerConfirm.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердить'**
  String get ownerConfirm;

  /// No description provided for @ownerRevoke.
  ///
  /// In ru, this message translates to:
  /// **'Отозвать'**
  String get ownerRevoke;

  /// No description provided for @ownerDefaultBusiness.
  ///
  /// In ru, this message translates to:
  /// **'Заведение'**
  String get ownerDefaultBusiness;

  /// No description provided for @ownerDefaultMember.
  ///
  /// In ru, this message translates to:
  /// **'Участник'**
  String get ownerDefaultMember;

  /// No description provided for @ownerDefaultManager.
  ///
  /// In ru, this message translates to:
  /// **'Менеджер'**
  String get ownerDefaultManager;

  /// No description provided for @ownerDefaultUser.
  ///
  /// In ru, this message translates to:
  /// **'Пользователь'**
  String get ownerDefaultUser;

  /// No description provided for @ownerTeamNoAccessTitle.
  ///
  /// In ru, this message translates to:
  /// **'Нет доступа'**
  String get ownerTeamNoAccessTitle;

  /// No description provided for @ownerTeamNoAccessBody.
  ///
  /// In ru, this message translates to:
  /// **'Управление командой доступно только владельцу заведения.'**
  String get ownerTeamNoAccessBody;

  /// No description provided for @ownerGoHome.
  ///
  /// In ru, this message translates to:
  /// **'На главную'**
  String get ownerGoHome;

  /// No description provided for @ownerInvite.
  ///
  /// In ru, this message translates to:
  /// **'Пригласить'**
  String get ownerInvite;

  /// No description provided for @ownerTeamMembers.
  ///
  /// In ru, this message translates to:
  /// **'Участники'**
  String get ownerTeamMembers;

  /// No description provided for @ownerTeamNoMembers.
  ///
  /// In ru, this message translates to:
  /// **'Нет участников'**
  String get ownerTeamNoMembers;

  /// No description provided for @ownerTeamPendingInvites.
  ///
  /// In ru, this message translates to:
  /// **'Ожидают приглашения'**
  String get ownerTeamPendingInvites;

  /// No description provided for @ownerTeamNoPendingInvites.
  ///
  /// In ru, this message translates to:
  /// **'Нет ожидающих приглашений'**
  String get ownerTeamNoPendingInvites;

  /// No description provided for @ownerTeamPlanNoManagers.
  ///
  /// In ru, this message translates to:
  /// **'Тариф не включает менеджеров.'**
  String get ownerTeamPlanNoManagers;

  /// No description provided for @ownerTeamManagerLimit.
  ///
  /// In ru, this message translates to:
  /// **'Достигнут лимит менеджеров вашего тарифа.'**
  String get ownerTeamManagerLimit;

  /// No description provided for @ownerViewPlans.
  ///
  /// In ru, this message translates to:
  /// **'Посмотреть тарифы'**
  String get ownerViewPlans;

  /// No description provided for @ownerTeamManagersUnavailable.
  ///
  /// In ru, this message translates to:
  /// **'Менеджеры недоступны на текущем тарифе'**
  String get ownerTeamManagersUnavailable;

  /// No description provided for @ownerTeamManagersUsage.
  ///
  /// In ru, this message translates to:
  /// **'Менеджеры: {used} из {limit}'**
  String ownerTeamManagersUsage(int used, int limit);

  /// No description provided for @ownerTeamManagersExtra.
  ///
  /// In ru, this message translates to:
  /// **' ({active} активных · {pending} ожидают)'**
  String ownerTeamManagersExtra(int active, int pending);

  /// No description provided for @ownerSuspendManagerTitle.
  ///
  /// In ru, this message translates to:
  /// **'Приостановить доступ менеджера?'**
  String get ownerSuspendManagerTitle;

  /// No description provided for @ownerSuspendManagerBody.
  ///
  /// In ru, this message translates to:
  /// **'Менеджер временно потеряет доступ к управлению бизнесом.'**
  String get ownerSuspendManagerBody;

  /// No description provided for @ownerAccessSuspended.
  ///
  /// In ru, this message translates to:
  /// **'Доступ приостановлен'**
  String get ownerAccessSuspended;

  /// No description provided for @ownerAccessRestored.
  ///
  /// In ru, this message translates to:
  /// **'Доступ восстановлен'**
  String get ownerAccessRestored;

  /// No description provided for @ownerRevokeManagerTitle.
  ///
  /// In ru, this message translates to:
  /// **'Удалить доступ менеджера?'**
  String get ownerRevokeManagerTitle;

  /// No description provided for @ownerRevokeManagerBody.
  ///
  /// In ru, this message translates to:
  /// **'Менеджер больше не сможет управлять этим бизнесом.'**
  String get ownerRevokeManagerBody;

  /// No description provided for @ownerAccessRevoked.
  ///
  /// In ru, this message translates to:
  /// **'Доступ отозван'**
  String get ownerAccessRevoked;

  /// No description provided for @ownerEditPermissions.
  ///
  /// In ru, this message translates to:
  /// **'Изменить права'**
  String get ownerEditPermissions;

  /// No description provided for @ownerSuspend.
  ///
  /// In ru, this message translates to:
  /// **'Приостановить'**
  String get ownerSuspend;

  /// No description provided for @ownerRemoveAccess.
  ///
  /// In ru, this message translates to:
  /// **'Удалить доступ'**
  String get ownerRemoveAccess;

  /// No description provided for @ownerRestore.
  ///
  /// In ru, this message translates to:
  /// **'Восстановить'**
  String get ownerRestore;

  /// No description provided for @ownerRevokeInviteTitle.
  ///
  /// In ru, this message translates to:
  /// **'Отозвать приглашение?'**
  String get ownerRevokeInviteTitle;

  /// No description provided for @ownerRevokeInviteBody.
  ///
  /// In ru, this message translates to:
  /// **'Отозвать приглашение для {email}?'**
  String ownerRevokeInviteBody(String email);

  /// No description provided for @ownerInviteRevoked.
  ///
  /// In ru, this message translates to:
  /// **'Приглашение отозвано'**
  String get ownerInviteRevoked;

  /// No description provided for @ownerInviteStatusLine.
  ///
  /// In ru, this message translates to:
  /// **'{status} · до {expires}'**
  String ownerInviteStatusLine(String status, String expires);

  /// No description provided for @ownerInvalidEmail.
  ///
  /// In ru, this message translates to:
  /// **'Укажите корректный email'**
  String get ownerInvalidEmail;

  /// No description provided for @ownerSelectPermission.
  ///
  /// In ru, this message translates to:
  /// **'Выберите хотя бы одно право доступа'**
  String get ownerSelectPermission;

  /// No description provided for @ownerInviteCreated.
  ///
  /// In ru, this message translates to:
  /// **'Приглашение создано'**
  String get ownerInviteCreated;

  /// No description provided for @ownerManagerAdded.
  ///
  /// In ru, this message translates to:
  /// **'Менеджер добавлен в команду'**
  String get ownerManagerAdded;

  /// No description provided for @ownerInviteManagerTitle.
  ///
  /// In ru, this message translates to:
  /// **'Пригласить менеджера'**
  String get ownerInviteManagerTitle;

  /// No description provided for @ownerInviteManagerBody.
  ///
  /// In ru, this message translates to:
  /// **'Укажите email и права. После создания отправьте ссылку менеджеру.'**
  String get ownerInviteManagerBody;

  /// No description provided for @ownerAccessPermissions.
  ///
  /// In ru, this message translates to:
  /// **'Права доступа'**
  String get ownerAccessPermissions;

  /// No description provided for @ownerInviteLinkHint.
  ///
  /// In ru, this message translates to:
  /// **'Отправьте эту ссылку менеджеру. Она одноразовая и действует ограниченное время.'**
  String get ownerInviteLinkHint;

  /// No description provided for @ownerLinkCopied.
  ///
  /// In ru, this message translates to:
  /// **'Ссылка скопирована'**
  String get ownerLinkCopied;

  /// No description provided for @ownerCopyLink.
  ///
  /// In ru, this message translates to:
  /// **'Скопировать ссылку'**
  String get ownerCopyLink;

  /// No description provided for @ownerSendInvite.
  ///
  /// In ru, this message translates to:
  /// **'Отправить приглашение'**
  String get ownerSendInvite;

  /// No description provided for @ownerPermissionsUpdated.
  ///
  /// In ru, this message translates to:
  /// **'Права обновлены'**
  String get ownerPermissionsUpdated;

  /// No description provided for @ownerManagerPermissionsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Права менеджера'**
  String get ownerManagerPermissionsTitle;

  /// No description provided for @ownerMonetizationTitle.
  ///
  /// In ru, this message translates to:
  /// **'Реклама и продвижение'**
  String get ownerMonetizationTitle;

  /// No description provided for @ownerSelectBusinessFirst.
  ///
  /// In ru, this message translates to:
  /// **'Сначала выберите заведение'**
  String get ownerSelectBusinessFirst;

  /// No description provided for @ownerChoosePromotionMethod.
  ///
  /// In ru, this message translates to:
  /// **'Выберите способ продвижения'**
  String get ownerChoosePromotionMethod;

  /// No description provided for @ownerPriceLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось получить цены. Проверьте подключение.'**
  String get ownerPriceLoadFailed;

  /// No description provided for @ownerProductsUnavailable.
  ///
  /// In ru, this message translates to:
  /// **'Рекламные продукты временно недоступны.'**
  String get ownerProductsUnavailable;

  /// No description provided for @ownerReadyPackages.
  ///
  /// In ru, this message translates to:
  /// **'Готовые пакеты'**
  String get ownerReadyPackages;

  /// No description provided for @ownerPackagesLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить пакеты.'**
  String get ownerPackagesLoadFailed;

  /// No description provided for @ownerMyPromotions.
  ///
  /// In ru, this message translates to:
  /// **'Мои продвижения'**
  String get ownerMyPromotions;

  /// No description provided for @ownerMyOrders.
  ///
  /// In ru, this message translates to:
  /// **'Мои заказы'**
  String get ownerMyOrders;

  /// No description provided for @ownerProductTitle.
  ///
  /// In ru, this message translates to:
  /// **'Продукт'**
  String get ownerProductTitle;

  /// No description provided for @ownerBusinessNotSelected.
  ///
  /// In ru, this message translates to:
  /// **'Заведение не выбрано'**
  String get ownerBusinessNotSelected;

  /// No description provided for @ownerPriceFailedShort.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось получить цены.'**
  String get ownerPriceFailedShort;

  /// No description provided for @ownerProductNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Продукт не найден'**
  String get ownerProductNotFound;

  /// No description provided for @ownerPeriodLabel.
  ///
  /// In ru, this message translates to:
  /// **'Период'**
  String get ownerPeriodLabel;

  /// No description provided for @ownerStartLabel.
  ///
  /// In ru, this message translates to:
  /// **'Начало'**
  String get ownerStartLabel;

  /// No description provided for @ownerStartAfterPayment.
  ///
  /// In ru, this message translates to:
  /// **'Сразу после оплаты'**
  String get ownerStartAfterPayment;

  /// No description provided for @ownerPickDate.
  ///
  /// In ru, this message translates to:
  /// **'Выбрать дату'**
  String get ownerPickDate;

  /// No description provided for @ownerSelectDate.
  ///
  /// In ru, this message translates to:
  /// **'Выберите дату'**
  String get ownerSelectDate;

  /// No description provided for @ownerDiscountPercent.
  ///
  /// In ru, this message translates to:
  /// **'Скидка {percent}%'**
  String ownerDiscountPercent(String percent);

  /// No description provided for @ownerGetQuote.
  ///
  /// In ru, this message translates to:
  /// **'Получить стоимость'**
  String get ownerGetQuote;

  /// No description provided for @ownerQuoteFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось получить стоимость.'**
  String get ownerQuoteFailed;

  /// No description provided for @ownerPromotionsLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить акции.'**
  String get ownerPromotionsLoadFailed;

  /// No description provided for @ownerCreatePromotionFirst.
  ///
  /// In ru, this message translates to:
  /// **'Сначала создайте активную акцию.'**
  String get ownerCreatePromotionFirst;

  /// No description provided for @ownerCreatePromotion.
  ///
  /// In ru, this message translates to:
  /// **'Создать акцию'**
  String get ownerCreatePromotion;

  /// No description provided for @ownerSelectPromotion.
  ///
  /// In ru, this message translates to:
  /// **'Выберите акцию'**
  String get ownerSelectPromotion;

  /// No description provided for @ownerActiveUntil.
  ///
  /// In ru, this message translates to:
  /// **'Активно до {date}'**
  String ownerActiveUntil(String date);

  /// No description provided for @ownerNextAvailableDate.
  ///
  /// In ru, this message translates to:
  /// **'Ближайшая доступная дата: {date}'**
  String ownerNextAvailableDate(String date);

  /// No description provided for @ownerReservedUntil.
  ///
  /// In ru, this message translates to:
  /// **'Место зарезервировано до {date}'**
  String ownerReservedUntil(String date);

  /// No description provided for @ownerPriceFrom.
  ///
  /// In ru, this message translates to:
  /// **'от {price}'**
  String ownerPriceFrom(String price);

  /// No description provided for @ownerCostLabel.
  ///
  /// In ru, this message translates to:
  /// **'Стоимость'**
  String get ownerCostLabel;

  /// No description provided for @ownerTotalLabel.
  ///
  /// In ru, this message translates to:
  /// **'Итого'**
  String get ownerTotalLabel;

  /// No description provided for @ownerSlotsOccupied.
  ///
  /// In ru, this message translates to:
  /// **'На выбранный период рекламные места заняты.'**
  String get ownerSlotsOccupied;

  /// No description provided for @ownerSettingsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Настройки'**
  String get ownerSettingsTitle;

  /// No description provided for @ownerAccountSection.
  ///
  /// In ru, this message translates to:
  /// **'Аккаунт'**
  String get ownerAccountSection;

  /// No description provided for @ownerPhoneLabel.
  ///
  /// In ru, this message translates to:
  /// **'Телефон'**
  String get ownerPhoneLabel;

  /// No description provided for @ownerPhoneMissing.
  ///
  /// In ru, this message translates to:
  /// **'Телефон не указан'**
  String get ownerPhoneMissing;

  /// No description provided for @ownerDisplayNameLabel.
  ///
  /// In ru, this message translates to:
  /// **'Имя владельца'**
  String get ownerDisplayNameLabel;

  /// No description provided for @ownerDisplayNameHint.
  ///
  /// In ru, this message translates to:
  /// **'Как отображать в кабинете'**
  String get ownerDisplayNameHint;

  /// No description provided for @ownerNameSaved.
  ///
  /// In ru, this message translates to:
  /// **'Имя сохранено'**
  String get ownerNameSaved;

  /// No description provided for @ownerBusinessSection.
  ///
  /// In ru, this message translates to:
  /// **'Заведение'**
  String get ownerBusinessSection;

  /// No description provided for @ownerBusinessSettingsHint.
  ///
  /// In ru, this message translates to:
  /// **'Редактируйте карточку, часы и контакты в профиле.'**
  String get ownerBusinessSettingsHint;

  /// No description provided for @ownerGallery.
  ///
  /// In ru, this message translates to:
  /// **'Галерея'**
  String get ownerGallery;

  /// No description provided for @ownerNoBusinessApply.
  ///
  /// In ru, this message translates to:
  /// **'Нет заведения — подайте заявку на модерацию.'**
  String get ownerNoBusinessApply;

  /// No description provided for @ownerRegister.
  ///
  /// In ru, this message translates to:
  /// **'Зарегистрировать'**
  String get ownerRegister;

  /// No description provided for @ownerSecuritySection.
  ///
  /// In ru, this message translates to:
  /// **'Безопасность'**
  String get ownerSecuritySection;

  /// No description provided for @ownerSecurityHint.
  ///
  /// In ru, this message translates to:
  /// **'Вход по SMS-коду. Для смены номера обратитесь в поддержку.'**
  String get ownerSecurityHint;

  /// No description provided for @ownerReviewReplySaved.
  ///
  /// In ru, this message translates to:
  /// **'Ответ сохранён'**
  String get ownerReviewReplySaved;

  /// No description provided for @ownerReviewsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Отзывы · {title}'**
  String ownerReviewsTitle(String title);

  /// No description provided for @ownerNoReviews.
  ///
  /// In ru, this message translates to:
  /// **'Пока нет отзывов'**
  String get ownerNoReviews;

  /// No description provided for @ownerReviewsSummary.
  ///
  /// In ru, this message translates to:
  /// **'{total} отзывов{unanswered}'**
  String ownerReviewsSummary(int total, String unanswered);

  /// No description provided for @ownerReviewsUnansweredSuffix.
  ///
  /// In ru, this message translates to:
  /// **' · {count} без ответа'**
  String ownerReviewsUnansweredSuffix(int count);

  /// No description provided for @ownerYourReply.
  ///
  /// In ru, this message translates to:
  /// **'Ваш ответ: {reply}'**
  String ownerYourReply(String reply);

  /// No description provided for @ownerReplyLabel.
  ///
  /// In ru, this message translates to:
  /// **'Ответ владельца'**
  String get ownerReplyLabel;

  /// No description provided for @ownerReplyAction.
  ///
  /// In ru, this message translates to:
  /// **'Ответить'**
  String get ownerReplyAction;

  /// No description provided for @ownerUpdateReply.
  ///
  /// In ru, this message translates to:
  /// **'Обновить'**
  String get ownerUpdateReply;

  /// No description provided for @ownerPromotionLimit.
  ///
  /// In ru, this message translates to:
  /// **'Лимит активных акций: {max}. Улучшите тариф.'**
  String ownerPromotionLimit(int max);

  /// No description provided for @ownerNewPromotion.
  ///
  /// In ru, this message translates to:
  /// **'Новая акция'**
  String get ownerNewPromotion;

  /// No description provided for @ownerEditPromotion.
  ///
  /// In ru, this message translates to:
  /// **'Редактировать акцию'**
  String get ownerEditPromotion;

  /// No description provided for @ownerFieldTitle.
  ///
  /// In ru, this message translates to:
  /// **'Название'**
  String get ownerFieldTitle;

  /// No description provided for @ownerFieldDiscount.
  ///
  /// In ru, this message translates to:
  /// **'Скидка'**
  String get ownerFieldDiscount;

  /// No description provided for @ownerFieldDescription.
  ///
  /// In ru, this message translates to:
  /// **'Описание'**
  String get ownerFieldDescription;

  /// No description provided for @ownerFieldTitleKkOptional.
  ///
  /// In ru, this message translates to:
  /// **'Название на казахском (необязательно)'**
  String get ownerFieldTitleKkOptional;

  /// No description provided for @ownerFieldDescriptionKkOptional.
  ///
  /// In ru, this message translates to:
  /// **'Описание на казахском (необязательно)'**
  String get ownerFieldDescriptionKkOptional;

  /// No description provided for @ownerFieldStatus.
  ///
  /// In ru, this message translates to:
  /// **'Статус'**
  String get ownerFieldStatus;

  /// No description provided for @ownerPromotionStatusCompleted.
  ///
  /// In ru, this message translates to:
  /// **'Завершена'**
  String get ownerPromotionStatusCompleted;

  /// No description provided for @ownerCreate.
  ///
  /// In ru, this message translates to:
  /// **'Создать'**
  String get ownerCreate;

  /// No description provided for @ownerPromotionCreated.
  ///
  /// In ru, this message translates to:
  /// **'Акция создана'**
  String get ownerPromotionCreated;

  /// No description provided for @ownerPromotionUpdated.
  ///
  /// In ru, this message translates to:
  /// **'Акция обновлена'**
  String get ownerPromotionUpdated;

  /// No description provided for @ownerDeletePromotionTitle.
  ///
  /// In ru, this message translates to:
  /// **'Удалить акцию?'**
  String get ownerDeletePromotionTitle;

  /// No description provided for @ownerDeletePromotionBody.
  ///
  /// In ru, this message translates to:
  /// **'«{title}» будет удалена без восстановления.'**
  String ownerDeletePromotionBody(String title);

  /// No description provided for @ownerPromotionDeleted.
  ///
  /// In ru, this message translates to:
  /// **'Акция удалена'**
  String get ownerPromotionDeleted;

  /// No description provided for @ownerPromotionsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Акции · {title}'**
  String ownerPromotionsTitle(String title);

  /// No description provided for @ownerNoPromotions.
  ///
  /// In ru, this message translates to:
  /// **'Пока нет акций'**
  String get ownerNoPromotions;

  /// No description provided for @ownerNoPromotionsHint.
  ///
  /// In ru, this message translates to:
  /// **'Создайте первую акцию для привлечения гостей'**
  String get ownerNoPromotionsHint;

  /// No description provided for @ownerActivePromotionsCount.
  ///
  /// In ru, this message translates to:
  /// **'Активных: {active} / {max}'**
  String ownerActivePromotionsCount(int active, int max);

  /// No description provided for @ownerEdit.
  ///
  /// In ru, this message translates to:
  /// **'Редактировать'**
  String get ownerEdit;

  /// No description provided for @ownerPlanTitle.
  ///
  /// In ru, this message translates to:
  /// **'Тариф'**
  String get ownerPlanTitle;

  /// No description provided for @ownerRegisterBusinessFirst.
  ///
  /// In ru, this message translates to:
  /// **'Сначала зарегистрируйте заведение'**
  String get ownerRegisterBusinessFirst;

  /// No description provided for @ownerPlanUpdated.
  ///
  /// In ru, this message translates to:
  /// **'Тариф обновлён'**
  String get ownerPlanUpdated;

  /// No description provided for @ownerPlanCurrent.
  ///
  /// In ru, this message translates to:
  /// **'Текущий: {name}'**
  String ownerPlanCurrent(String name);

  /// No description provided for @ownerPlanPromoteSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'TOP, VIP-баннер, пакеты и статистика'**
  String get ownerPlanPromoteSubtitle;

  /// No description provided for @ownerPlanPeriodMonth.
  ///
  /// In ru, this message translates to:
  /// **'месяц'**
  String get ownerPlanPeriodMonth;

  /// No description provided for @ownerPlanPeriodDays.
  ///
  /// In ru, this message translates to:
  /// **'{days} дн.'**
  String ownerPlanPeriodDays(int days);

  /// No description provided for @ownerMenuEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Пока нет позиций в меню'**
  String get ownerMenuEmpty;

  /// No description provided for @ownerMenuOtherGroup.
  ///
  /// In ru, this message translates to:
  /// **'Прочее'**
  String get ownerMenuOtherGroup;

  /// No description provided for @ownerTeamForbidden.
  ///
  /// In ru, this message translates to:
  /// **'У вас нет прав для этого действия.'**
  String get ownerTeamForbidden;

  /// No description provided for @ownerTeamNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Запись не найдена.'**
  String get ownerTeamNotFound;

  /// No description provided for @ownerTeamActionFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось выполнить действие. Попробуйте позже.'**
  String get ownerTeamActionFailed;

  /// No description provided for @ownerInviteNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Приглашение не найдено или ссылка недействительна.'**
  String get ownerInviteNotFound;

  /// No description provided for @ownerAcceptingInvite.
  ///
  /// In ru, this message translates to:
  /// **'Принимаем…'**
  String get ownerAcceptingInvite;

  /// No description provided for @ownerAcceptInvite.
  ///
  /// In ru, this message translates to:
  /// **'Принять приглашение'**
  String get ownerAcceptInvite;

  /// No description provided for @ownerGalleryTitle.
  ///
  /// In ru, this message translates to:
  /// **'Галерея · {title}'**
  String ownerGalleryTitle(String title);

  /// No description provided for @ownerPhotoLimitSnackbar.
  ///
  /// In ru, this message translates to:
  /// **'Лимит тарифа: не более {max} фото. Улучшите тариф в разделе «Тариф».'**
  String ownerPhotoLimitSnackbar(int max);

  /// No description provided for @ownerCoverUpdated.
  ///
  /// In ru, this message translates to:
  /// **'Обложка обновлена'**
  String get ownerCoverUpdated;

  /// No description provided for @ownerPhotoAdded.
  ///
  /// In ru, this message translates to:
  /// **'Фото добавлено'**
  String get ownerPhotoAdded;

  /// No description provided for @ownerUploadError.
  ///
  /// In ru, this message translates to:
  /// **'Ошибка загрузки: {details}'**
  String ownerUploadError(String details);

  /// No description provided for @ownerPhotosUsage.
  ///
  /// In ru, this message translates to:
  /// **'Фото: {used} / {max}{suffix}'**
  String ownerPhotosUsage(int used, int max, String suffix);

  /// No description provided for @ownerPhotoLimitReached.
  ///
  /// In ru, this message translates to:
  /// **' · лимит достигнут'**
  String get ownerPhotoLimitReached;

  /// No description provided for @ownerGalleryEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Галерея пустая'**
  String get ownerGalleryEmpty;

  /// No description provided for @ownerGalleryEmptyHint.
  ///
  /// In ru, this message translates to:
  /// **'Добавьте фото интерьера, блюд или услуг'**
  String get ownerGalleryEmptyHint;

  /// No description provided for @ownerCoverLabel.
  ///
  /// In ru, this message translates to:
  /// **'Обложка'**
  String get ownerCoverLabel;

  /// No description provided for @ownerSetCover.
  ///
  /// In ru, this message translates to:
  /// **'Сделать обложкой'**
  String get ownerSetCover;

  /// No description provided for @ownerPhotoLabel.
  ///
  /// In ru, this message translates to:
  /// **'Фото'**
  String get ownerPhotoLabel;

  /// No description provided for @ownerEditProfileTitle.
  ///
  /// In ru, this message translates to:
  /// **'Профиль заведения'**
  String get ownerEditProfileTitle;

  /// No description provided for @ownerFieldShortDesc.
  ///
  /// In ru, this message translates to:
  /// **'Краткое описание'**
  String get ownerFieldShortDesc;

  /// No description provided for @ownerFieldFullDesc.
  ///
  /// In ru, this message translates to:
  /// **'Полное описание'**
  String get ownerFieldFullDesc;

  /// No description provided for @ownerContactsSection.
  ///
  /// In ru, this message translates to:
  /// **'Контакты'**
  String get ownerContactsSection;

  /// No description provided for @ownerWorkHoursSection.
  ///
  /// In ru, this message translates to:
  /// **'График работы'**
  String get ownerWorkHoursSection;

  /// No description provided for @ownerWorkHoursFormat.
  ///
  /// In ru, this message translates to:
  /// **'Формат: 09:00-22:00'**
  String get ownerWorkHoursFormat;

  /// No description provided for @ownerWorkHoursWeekdays.
  ///
  /// In ru, this message translates to:
  /// **'Пн–Пт'**
  String get ownerWorkHoursWeekdays;

  /// No description provided for @ownerWorkHoursSaturday.
  ///
  /// In ru, this message translates to:
  /// **'Суббота'**
  String get ownerWorkHoursSaturday;

  /// No description provided for @ownerWorkHoursSunday.
  ///
  /// In ru, this message translates to:
  /// **'Воскресенье'**
  String get ownerWorkHoursSunday;

  /// No description provided for @ownerRequiredNameAddress.
  ///
  /// In ru, this message translates to:
  /// **'Заполните название и адрес'**
  String get ownerRequiredNameAddress;

  /// No description provided for @ownerProfileSaved.
  ///
  /// In ru, this message translates to:
  /// **'Профиль заведения сохранён'**
  String get ownerProfileSaved;

  /// No description provided for @ownerSubcategoriesSection.
  ///
  /// In ru, this message translates to:
  /// **'Подкатегории'**
  String get ownerSubcategoriesSection;

  /// No description provided for @ownerSubcategoriesHint.
  ///
  /// In ru, this message translates to:
  /// **'Выберите типы заведения внутри категории — так пользователи быстрее найдут вас в приложении.'**
  String get ownerSubcategoriesHint;

  /// No description provided for @ownerSubcategoriesEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Подкатегории пока не настроены для вашей категории.'**
  String get ownerSubcategoriesEmpty;

  /// No description provided for @ownerSubcategoriesLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить подкатегории. Проверьте сеть и попробуйте снова.'**
  String get ownerSubcategoriesLoadFailed;

  /// No description provided for @ownerSaveSubcategories.
  ///
  /// In ru, this message translates to:
  /// **'Сохранить подкатегории'**
  String get ownerSaveSubcategories;

  /// No description provided for @ownerSubcategoriesSaved.
  ///
  /// In ru, this message translates to:
  /// **'Подкатегории сохранены'**
  String get ownerSubcategoriesSaved;

  /// No description provided for @ownerAnalyticsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Статистика'**
  String get ownerAnalyticsTitle;

  /// No description provided for @ownerAnalyticsAds.
  ///
  /// In ru, this message translates to:
  /// **'Реклама'**
  String get ownerAnalyticsAds;

  /// No description provided for @ownerAnalyticsLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить статистику. Проверьте сеть и попробуйте снова.'**
  String get ownerAnalyticsLoadFailed;

  /// No description provided for @ownerAnalyticsPeriodDays.
  ///
  /// In ru, this message translates to:
  /// **'{days} дн'**
  String ownerAnalyticsPeriodDays(int days);

  /// No description provided for @ownerAnalyticsOverview.
  ///
  /// In ru, this message translates to:
  /// **'Обзор'**
  String get ownerAnalyticsOverview;

  /// No description provided for @ownerAnalyticsTargetActions.
  ///
  /// In ru, this message translates to:
  /// **'Целевые действия'**
  String get ownerAnalyticsTargetActions;

  /// No description provided for @ownerAnalyticsAdsStats.
  ///
  /// In ru, this message translates to:
  /// **'Статистика рекламы'**
  String get ownerAnalyticsAdsStats;

  /// No description provided for @ownerAnalyticsAcquisition.
  ///
  /// In ru, this message translates to:
  /// **'Привлечение'**
  String get ownerAnalyticsAcquisition;

  /// No description provided for @ownerAnalyticsSourcesPro.
  ///
  /// In ru, this message translates to:
  /// **'Источники доступны в PRO'**
  String get ownerAnalyticsSourcesPro;

  /// No description provided for @ownerAnalyticsSourcesEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Источники'**
  String get ownerAnalyticsSourcesEmpty;

  /// No description provided for @ownerAnalyticsNotEnoughData.
  ///
  /// In ru, this message translates to:
  /// **'Недостаточно данных'**
  String get ownerAnalyticsNotEnoughData;

  /// No description provided for @ownerAnalyticsSearchQueries.
  ///
  /// In ru, this message translates to:
  /// **'Что ищут пользователи'**
  String get ownerAnalyticsSearchQueries;

  /// No description provided for @ownerAnalyticsSearchEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Недостаточно данных для анализа поисковых запросов'**
  String get ownerAnalyticsSearchEmpty;

  /// No description provided for @ownerAnalyticsSearchPro.
  ///
  /// In ru, this message translates to:
  /// **'Поисковые запросы доступны в PRO'**
  String get ownerAnalyticsSearchPro;

  /// No description provided for @ownerExportFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось подготовить отчёт. Попробуйте ещё раз.'**
  String get ownerExportFailed;

  /// No description provided for @ownerExportForbidden.
  ///
  /// In ru, this message translates to:
  /// **'Экспорт недоступен для вашей роли или тарифа.'**
  String get ownerExportForbidden;

  /// No description provided for @ownerExportCsv.
  ///
  /// In ru, this message translates to:
  /// **'Экспорт CSV'**
  String get ownerExportCsv;

  /// No description provided for @ownerExportPreparing.
  ///
  /// In ru, this message translates to:
  /// **'Формирование…'**
  String get ownerExportPreparing;

  /// No description provided for @ownerSearchOtherQueries.
  ///
  /// In ru, this message translates to:
  /// **'Другие запросы — {count}'**
  String ownerSearchOtherQueries(String count);

  /// No description provided for @ownerSearchTransitions.
  ///
  /// In ru, this message translates to:
  /// **'{count} переходов'**
  String ownerSearchTransitions(String count);

  /// No description provided for @ownerSourcesDetailLater.
  ///
  /// In ru, this message translates to:
  /// **'Детальная атрибуция источников появится позже.'**
  String get ownerSourcesDetailLater;

  /// No description provided for @ownerBenchmarkSection.
  ///
  /// In ru, this message translates to:
  /// **'Сравнение с категорией'**
  String get ownerBenchmarkSection;

  /// No description provided for @ownerBenchmarkNotEnough.
  ///
  /// In ru, this message translates to:
  /// **'Пока недостаточно данных для сравнения'**
  String get ownerBenchmarkNotEnough;

  /// No description provided for @ownerRecommendationsSection.
  ///
  /// In ru, this message translates to:
  /// **'Рекомендации'**
  String get ownerRecommendationsSection;

  /// No description provided for @ownerPackageTitle.
  ///
  /// In ru, this message translates to:
  /// **'Пакет'**
  String get ownerPackageTitle;

  /// No description provided for @ownerPackageNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Пакет не найден'**
  String get ownerPackageNotFound;

  /// No description provided for @ownerPackageContents.
  ///
  /// In ru, this message translates to:
  /// **'Состав пакета'**
  String get ownerPackageContents;

  /// No description provided for @ownerPackageQuoteFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось получить стоимость пакета.'**
  String get ownerPackageQuoteFailed;

  /// No description provided for @ownerNoPromotionsForAds.
  ///
  /// In ru, this message translates to:
  /// **'Нет активных акций для продвижения.'**
  String get ownerNoPromotionsForAds;

  /// No description provided for @ownerOrderTitle.
  ///
  /// In ru, this message translates to:
  /// **'Заказ'**
  String get ownerOrderTitle;

  /// No description provided for @ownerOrderCreated.
  ///
  /// In ru, this message translates to:
  /// **'Заказ создан'**
  String get ownerOrderCreated;

  /// No description provided for @ownerToPay.
  ///
  /// In ru, this message translates to:
  /// **'К оплате:'**
  String get ownerToPay;

  /// No description provided for @ownerRefreshStatus.
  ///
  /// In ru, this message translates to:
  /// **'Обновить статус'**
  String get ownerRefreshStatus;

  /// No description provided for @ownerNoOrders.
  ///
  /// In ru, this message translates to:
  /// **'У вас пока нет заказов'**
  String get ownerNoOrders;

  /// No description provided for @ownerOrdersLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить заказы.'**
  String get ownerOrdersLoadFailed;

  /// No description provided for @ownerOrderNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Заказ не найден.'**
  String get ownerOrderNotFound;

  /// No description provided for @ownerYourOrder.
  ///
  /// In ru, this message translates to:
  /// **'Ваш заказ'**
  String get ownerYourOrder;

  /// No description provided for @ownerAfterPayment.
  ///
  /// In ru, this message translates to:
  /// **'после оплаты'**
  String get ownerAfterPayment;

  /// No description provided for @ownerConfirmOrder.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердить заказ'**
  String get ownerConfirmOrder;

  /// No description provided for @ownerOrderCreateFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось создать заказ.'**
  String get ownerOrderCreateFailed;

  /// No description provided for @ownerCampaignsLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить продвижения.'**
  String get ownerCampaignsLoadFailed;

  /// No description provided for @ownerNoCampaigns.
  ///
  /// In ru, this message translates to:
  /// **'Нет активных продвижений'**
  String get ownerNoCampaigns;

  /// No description provided for @ownerCampaignGroupActive.
  ///
  /// In ru, this message translates to:
  /// **'Активные'**
  String get ownerCampaignGroupActive;

  /// No description provided for @ownerCampaignGroupScheduled.
  ///
  /// In ru, this message translates to:
  /// **'Запланированные'**
  String get ownerCampaignGroupScheduled;

  /// No description provided for @ownerCampaignGroupModeration.
  ///
  /// In ru, this message translates to:
  /// **'На модерации'**
  String get ownerCampaignGroupModeration;

  /// No description provided for @ownerCampaignGroupCompleted.
  ///
  /// In ru, this message translates to:
  /// **'Завершённые'**
  String get ownerCampaignGroupCompleted;

  /// No description provided for @ownerCampaignGroupOther.
  ///
  /// In ru, this message translates to:
  /// **'Другие'**
  String get ownerCampaignGroupOther;

  /// No description provided for @ownerCampaignDaysLeft.
  ///
  /// In ru, this message translates to:
  /// **'Осталось {days} {unit}'**
  String ownerCampaignDaysLeft(int days, String unit);

  /// No description provided for @ownerCampaignMetrics.
  ///
  /// In ru, this message translates to:
  /// **'Показы: {served} · Просмотры: {views} · Переходы: {clicks}'**
  String ownerCampaignMetrics(String served, String views, String clicks);

  /// No description provided for @ownerCampaignNotFound.
  ///
  /// In ru, this message translates to:
  /// **'Кампания не найдена.'**
  String get ownerCampaignNotFound;

  /// No description provided for @ownerCampaignPeriod.
  ///
  /// In ru, this message translates to:
  /// **'Период: {range}'**
  String ownerCampaignPeriod(String range);

  /// No description provided for @ownerCampaignStatsFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить статистику.'**
  String get ownerCampaignStatsFailed;

  /// No description provided for @ownerCampaignStatsPending.
  ///
  /// In ru, this message translates to:
  /// **'Статистика появится после начала показов.'**
  String get ownerCampaignStatsPending;

  /// No description provided for @ownerCampaignViews.
  ///
  /// In ru, this message translates to:
  /// **'Просмотры'**
  String get ownerCampaignViews;

  /// No description provided for @ownerCampaignClicks.
  ///
  /// In ru, this message translates to:
  /// **'Переходы'**
  String get ownerCampaignClicks;

  /// No description provided for @ownerGotIt.
  ///
  /// In ru, this message translates to:
  /// **'Понятно'**
  String get ownerGotIt;

  /// No description provided for @ownerCampaignActions.
  ///
  /// In ru, this message translates to:
  /// **'Действия'**
  String get ownerCampaignActions;

  /// No description provided for @ownerVipBannerTitle.
  ///
  /// In ru, this message translates to:
  /// **'VIP-баннер'**
  String get ownerVipBannerTitle;

  /// No description provided for @ownerVipImageLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить изображение.'**
  String get ownerVipImageLoadFailed;

  /// No description provided for @ownerVipTitleMinLength.
  ///
  /// In ru, this message translates to:
  /// **'Введите заголовок (минимум 2 символа).'**
  String get ownerVipTitleMinLength;

  /// No description provided for @ownerVipSaveFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось сохранить баннер.'**
  String get ownerVipSaveFailed;

  /// No description provided for @ownerVipHeadlineLabel.
  ///
  /// In ru, this message translates to:
  /// **'Заголовок'**
  String get ownerVipHeadlineLabel;

  /// No description provided for @ownerVipHeadlineHint.
  ///
  /// In ru, this message translates to:
  /// **'Заголовок баннера'**
  String get ownerVipHeadlineHint;

  /// No description provided for @ownerVipDescriptionOptional.
  ///
  /// In ru, this message translates to:
  /// **'Описание (необязательно)'**
  String get ownerVipDescriptionOptional;

  /// No description provided for @ownerVipButtonLabel.
  ///
  /// In ru, this message translates to:
  /// **'Текст кнопки'**
  String get ownerVipButtonLabel;

  /// No description provided for @ownerVipDefaultButton.
  ///
  /// In ru, this message translates to:
  /// **'Подробнее'**
  String get ownerVipDefaultButton;

  /// No description provided for @ownerVipUploadImage.
  ///
  /// In ru, this message translates to:
  /// **'Загрузить изображение'**
  String get ownerVipUploadImage;

  /// No description provided for @ownerVipReplaceImage.
  ///
  /// In ru, this message translates to:
  /// **'Заменить изображение'**
  String get ownerVipReplaceImage;

  /// No description provided for @ownerHidePreview.
  ///
  /// In ru, this message translates to:
  /// **'Скрыть предпросмотр'**
  String get ownerHidePreview;

  /// No description provided for @ownerShowPreview.
  ///
  /// In ru, this message translates to:
  /// **'Предпросмотр'**
  String get ownerShowPreview;

  /// No description provided for @ownerContinueToOrder.
  ///
  /// In ru, this message translates to:
  /// **'Продолжить к заказу'**
  String get ownerContinueToOrder;

  /// No description provided for @ownerAnalyticsCardViews.
  ///
  /// In ru, this message translates to:
  /// **'Просмотры карточки'**
  String get ownerAnalyticsCardViews;

  /// No description provided for @ownerAnalyticsImpressionsLabel.
  ///
  /// In ru, this message translates to:
  /// **'Показы'**
  String get ownerAnalyticsImpressionsLabel;

  /// No description provided for @ownerAnalyticsConversionTitle.
  ///
  /// In ru, this message translates to:
  /// **'Конверсия в действие'**
  String get ownerAnalyticsConversionTitle;

  /// No description provided for @ownerAnalyticsConversionHint.
  ///
  /// In ru, this message translates to:
  /// **'Доля просмотров карточки, после которых пользователь совершил целевое действие: звонок, WhatsApp, маршрут, сайт, Instagram или добавление в избранное.'**
  String get ownerAnalyticsConversionHint;

  /// No description provided for @ownerAnalyticsChartViewsDays.
  ///
  /// In ru, this message translates to:
  /// **'Просмотры за {days} дн.'**
  String ownerAnalyticsChartViewsDays(int days);

  /// No description provided for @ownerAnalyticsChartActionsDays.
  ///
  /// In ru, this message translates to:
  /// **'Действия за {days} дн.'**
  String ownerAnalyticsChartActionsDays(int days);

  /// No description provided for @ownerAnalyticsFunnelStepImpressions.
  ///
  /// In ru, this message translates to:
  /// **'{count} показов'**
  String ownerAnalyticsFunnelStepImpressions(String count);

  /// No description provided for @ownerAnalyticsFunnelStepViews.
  ///
  /// In ru, this message translates to:
  /// **'{count} просмотров'**
  String ownerAnalyticsFunnelStepViews(String count);

  /// No description provided for @ownerAnalyticsFunnelStepActions.
  ///
  /// In ru, this message translates to:
  /// **'{count} целевых действий'**
  String ownerAnalyticsFunnelStepActions(String count);

  /// No description provided for @ownerAnalyticsPeriodFunnel.
  ///
  /// In ru, this message translates to:
  /// **'Воронка периода'**
  String get ownerAnalyticsPeriodFunnel;

  /// No description provided for @ownerAnalyticsConversionLine.
  ///
  /// In ru, this message translates to:
  /// **'Конверсия в действие: {value}'**
  String ownerAnalyticsConversionLine(String value);

  /// No description provided for @ownerAnalyticsAggregatedNote.
  ///
  /// In ru, this message translates to:
  /// **'Показатели рассчитаны по агрегированным данным периода.'**
  String get ownerAnalyticsAggregatedNote;

  /// No description provided for @ownerAnalyticsVsPreviousPeriod.
  ///
  /// In ru, this message translates to:
  /// **'К предыдущему периоду'**
  String get ownerAnalyticsVsPreviousPeriod;

  /// No description provided for @ownerAnalyticsPopularHours.
  ///
  /// In ru, this message translates to:
  /// **'Популярное время'**
  String get ownerAnalyticsPopularHours;

  /// No description provided for @ownerAnalyticsAudience.
  ///
  /// In ru, this message translates to:
  /// **'Аудитория'**
  String get ownerAnalyticsAudience;

  /// No description provided for @ownerAnalyticsAudienceSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Доли просмотров карточки по типу посетителя'**
  String get ownerAnalyticsAudienceSubtitle;

  /// No description provided for @ownerAnalyticsNewVisitors.
  ///
  /// In ru, this message translates to:
  /// **'Новые посетители'**
  String get ownerAnalyticsNewVisitors;

  /// No description provided for @ownerAnalyticsReturningVisitors.
  ///
  /// In ru, this message translates to:
  /// **'Вернувшиеся посетители'**
  String get ownerAnalyticsReturningVisitors;

  /// No description provided for @ownerAnalyticsAudienceDistanceEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Недостаточно данных для анализа аудитории по расстоянию'**
  String get ownerAnalyticsAudienceDistanceEmpty;

  /// No description provided for @ownerAnalyticsViewsShare.
  ///
  /// In ru, this message translates to:
  /// **'Доля просмотров: {share}'**
  String ownerAnalyticsViewsShare(String share);

  /// No description provided for @ownerAnalyticsUniqueVisitors.
  ///
  /// In ru, this message translates to:
  /// **'Уникальные посетители'**
  String get ownerAnalyticsUniqueVisitors;

  /// No description provided for @ownerAnalyticsSessions.
  ///
  /// In ru, this message translates to:
  /// **'Сессии'**
  String get ownerAnalyticsSessions;

  /// No description provided for @ownerAnalyticsDailyUniqueSum.
  ///
  /// In ru, this message translates to:
  /// **'Суммарно уникальных посетителей по дням'**
  String get ownerAnalyticsDailyUniqueSum;

  /// No description provided for @ownerAnalyticsDailySessionsSum.
  ///
  /// In ru, this message translates to:
  /// **'Суммарно сессий по дням'**
  String get ownerAnalyticsDailySessionsSum;

  /// No description provided for @ownerAnalyticsDistanceTitle.
  ///
  /// In ru, this message translates to:
  /// **'Расстояние до заведения'**
  String get ownerAnalyticsDistanceTitle;

  /// No description provided for @ownerAnalyticsDistanceHint.
  ///
  /// In ru, this message translates to:
  /// **'Агрегированные интервалы без точных координат пользователей.'**
  String get ownerAnalyticsDistanceHint;

  /// No description provided for @ownerAnalyticsContentSection.
  ///
  /// In ru, this message translates to:
  /// **'Контент'**
  String get ownerAnalyticsContentSection;

  /// No description provided for @ownerAnalyticsPromotionViewsLine.
  ///
  /// In ru, this message translates to:
  /// **'Просмотры акций: {count}'**
  String ownerAnalyticsPromotionViewsLine(String count);

  /// No description provided for @ownerAnalyticsPromotionItemTitle.
  ///
  /// In ru, this message translates to:
  /// **'Акция · {id}'**
  String ownerAnalyticsPromotionItemTitle(String id);

  /// No description provided for @ownerAnalyticsPromotionActionsNotMeasured.
  ///
  /// In ru, this message translates to:
  /// **'Действия по акциям пока не измеряются'**
  String get ownerAnalyticsPromotionActionsNotMeasured;

  /// No description provided for @ownerAnalyticsCatalogSection.
  ///
  /// In ru, this message translates to:
  /// **'Каталог'**
  String get ownerAnalyticsCatalogSection;

  /// No description provided for @ownerAnalyticsCatalogItemTitle.
  ///
  /// In ru, this message translates to:
  /// **'Позиция · {id}'**
  String ownerAnalyticsCatalogItemTitle(String id);

  /// No description provided for @ownerAnalyticsCatalogItemEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Позиция'**
  String get ownerAnalyticsCatalogItemEmpty;

  /// No description provided for @ownerAnalyticsCatalogActionsNotMeasured.
  ///
  /// In ru, this message translates to:
  /// **'Действия по позициям каталога пока не измеряются'**
  String get ownerAnalyticsCatalogActionsNotMeasured;

  /// No description provided for @ownerAnalyticsStatsAfterFirstView.
  ///
  /// In ru, this message translates to:
  /// **'Статистика появится после первых просмотров карточки.'**
  String get ownerAnalyticsStatsAfterFirstView;

  /// No description provided for @ownerAnalyticsSegmentViews.
  ///
  /// In ru, this message translates to:
  /// **'Просмотры'**
  String get ownerAnalyticsSegmentViews;

  /// No description provided for @ownerAnalyticsSegmentActions.
  ///
  /// In ru, this message translates to:
  /// **'Действия'**
  String get ownerAnalyticsSegmentActions;

  /// No description provided for @ownerHelpQuickStart.
  ///
  /// In ru, this message translates to:
  /// **'Быстрый старт'**
  String get ownerHelpQuickStart;

  /// No description provided for @ownerHelpStep1.
  ///
  /// In ru, this message translates to:
  /// **'1. Заполните профиль и загрузите фото'**
  String get ownerHelpStep1;

  /// No description provided for @ownerHelpStep2.
  ///
  /// In ru, this message translates to:
  /// **'2. Добавьте меню или услуги'**
  String get ownerHelpStep2;

  /// No description provided for @ownerHelpStep3.
  ///
  /// In ru, this message translates to:
  /// **'3. Создайте первую акцию'**
  String get ownerHelpStep3;

  /// No description provided for @ownerHelpStep4.
  ///
  /// In ru, this message translates to:
  /// **'4. Смотрите статистику на главной'**
  String get ownerHelpStep4;

  /// No description provided for @ownerHelpPlansPromote.
  ///
  /// In ru, this message translates to:
  /// **'Тарифы и продвижение'**
  String get ownerHelpPlansPromote;

  /// No description provided for @ownerTeamInvitationTitle.
  ///
  /// In ru, this message translates to:
  /// **'Приглашение в команду'**
  String get ownerTeamInvitationTitle;

  /// No description provided for @ownerInvitationForEmail.
  ///
  /// In ru, this message translates to:
  /// **'Для: {email}'**
  String ownerInvitationForEmail(String email);

  /// No description provided for @ownerMenuNewGroup.
  ///
  /// In ru, this message translates to:
  /// **'Новая группа'**
  String get ownerMenuNewGroup;

  /// No description provided for @ownerMenuEditGroup.
  ///
  /// In ru, this message translates to:
  /// **'Редактировать группу'**
  String get ownerMenuEditGroup;

  /// No description provided for @ownerMenuGroupNameLabel.
  ///
  /// In ru, this message translates to:
  /// **'Название группы *'**
  String get ownerMenuGroupNameLabel;

  /// No description provided for @ownerMenuGroupNameHint.
  ///
  /// In ru, this message translates to:
  /// **'Например: Горячие блюда, Стрижка'**
  String get ownerMenuGroupNameHint;

  /// No description provided for @ownerMenuNewItem.
  ///
  /// In ru, this message translates to:
  /// **'Новая позиция'**
  String get ownerMenuNewItem;

  /// No description provided for @ownerMenuGroupField.
  ///
  /// In ru, this message translates to:
  /// **'Группа'**
  String get ownerMenuGroupField;

  /// No description provided for @ownerMenuNoGroup.
  ///
  /// In ru, this message translates to:
  /// **'Без группы'**
  String get ownerMenuNoGroup;

  /// No description provided for @ownerMenuPriceLabel.
  ///
  /// In ru, this message translates to:
  /// **'Цена (₸)'**
  String get ownerMenuPriceLabel;

  /// No description provided for @ownerCatalogServicesTitle.
  ///
  /// In ru, this message translates to:
  /// **'Товары и услуги · {title}'**
  String ownerCatalogServicesTitle(String title);

  /// No description provided for @ownerMenuAddGroup.
  ///
  /// In ru, this message translates to:
  /// **'Группа'**
  String get ownerMenuAddGroup;

  /// No description provided for @ownerMenuAddItem.
  ///
  /// In ru, this message translates to:
  /// **'Позиция'**
  String get ownerMenuAddItem;

  /// No description provided for @ownerMenuNoSection.
  ///
  /// In ru, this message translates to:
  /// **'Без раздела'**
  String get ownerMenuNoSection;

  /// No description provided for @ownerMenuHideItem.
  ///
  /// In ru, this message translates to:
  /// **'Скрыть'**
  String get ownerMenuHideItem;

  /// No description provided for @ownerMenuShowItem.
  ///
  /// In ru, this message translates to:
  /// **'Показать'**
  String get ownerMenuShowItem;

  /// No description provided for @ownerPlanPurchaseUnavailable.
  ///
  /// In ru, this message translates to:
  /// **'Покупка недоступна'**
  String get ownerPlanPurchaseUnavailable;

  /// No description provided for @ownerPlanGoToAds.
  ///
  /// In ru, this message translates to:
  /// **'Перейти к рекламе'**
  String get ownerPlanGoToAds;

  /// No description provided for @ownerScheduledRange.
  ///
  /// In ru, this message translates to:
  /// **'{start} — {end}'**
  String ownerScheduledRange(String start, String end);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['kk', 'ru'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'kk':
      return AppLocalizationsKk();
    case 'ru':
      return AppLocalizationsRu();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
