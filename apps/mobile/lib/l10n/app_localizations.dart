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
