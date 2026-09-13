// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Kazakh (`kk`).
class AppLocalizationsKk extends AppLocalizations {
  AppLocalizationsKk([String locale = 'kk']) : super(locale);

  @override
  String get appTitle => 'QalaGo';

  @override
  String get navHome => 'Басты бет';

  @override
  String get navCategories => 'Санаттар';

  @override
  String get navMap => 'Карта';

  @override
  String get navFavorites => 'Таңдаулылар';

  @override
  String get navProfile => 'Профиль';

  @override
  String get commonRetry => 'Қайталап көру';

  @override
  String get commonCancel => 'Болдырмау';

  @override
  String get commonSave => 'Сақтау';

  @override
  String get commonBack => 'Артқа';

  @override
  String get commonDone => 'Дайын';

  @override
  String get commonMore => 'Тағы';

  @override
  String get commonTryAgain => 'Қайталап көру';

  @override
  String get commonSomethingWrong => 'Бір нәрсе дұрыс болмады';

  @override
  String get commonNoData => 'Дерек жоқ';

  @override
  String get commonContinue => 'Жалғастыру';

  @override
  String get commonDelete => 'Жою';

  @override
  String get commonLogin => 'Кіру';

  @override
  String get commonReset => 'Тазарту';

  @override
  String get commonAll => 'Барлығы';

  @override
  String get commonAllCategories => 'Барлық санаттар';

  @override
  String get commonAd => 'Жарнама';

  @override
  String get commonViewAll => 'Барлығын көру';

  @override
  String get homeSearchPlaceholder => 'Мекемелер мен қызметтерді іздеу...';

  @override
  String get homeCategoriesEmpty => 'Санаттар әлі қосылмаған';

  @override
  String get homePromotionsEmpty => 'Белсенді акциялар жоқ';

  @override
  String get homePopularEmpty => 'Танымал мекемелер жоқ';

  @override
  String get homePromotionsSection => 'Акциялар мен ұсыныстар';

  @override
  String get homeNearbySection => 'Жаныңызда';

  @override
  String get homeRecommendedSection => 'Ұсынамыз';

  @override
  String get homeNearbySubtitle => 'Жаныңыздағы орындар · 3 км дейін';

  @override
  String get homeNearbyEmpty => '3 км радиусында әлі мекемелер жоқ';

  @override
  String get homeNotificationsTooltip => 'Хабарландырулар';

  @override
  String get homeFeaturedPrevTooltip => 'Алдыңғы мекеме';

  @override
  String get homeFeaturedNextTooltip => 'Келесі мекеме';

  @override
  String get homeCategoryMoreSemantics => 'Тағы санаттар';

  @override
  String get homeCategoriesSection => 'Санаттар';

  @override
  String get categoriesTitle => 'Санаттар';

  @override
  String get categoriesFilterHint => 'Санат атауы бойынша сүзгі...';

  @override
  String get categoriesSearchBusinesses => 'Мекемелерді іздеу';

  @override
  String get categoriesNotFound => 'Санаттар табылмады';

  @override
  String get categoriesSort => 'Сұрыптау';

  @override
  String get categoryRecommended => 'Ұсынылатын';

  @override
  String get categoryNearest => 'Сізге жақын';

  @override
  String get categoryByRating => 'Рейтинг бойынша';

  @override
  String get categoryPopular => 'Танымал';

  @override
  String get categoryEmpty => 'Бұл санатта әлі орындар жоқ';

  @override
  String get categorySubEmpty => 'Бұл ішкі санатта әлі орындар жоқ';

  @override
  String get categoryNearestNeedsLocation =>
      'Ең жақын орындарды көрсету үшін геопозицияға рұқсат беріңіз';

  @override
  String get categorySponsored => 'Жарнамалық орындар';

  @override
  String get categoryAllPlaces => 'Барлық орындар';

  @override
  String get searchPlaceholder => 'Мекемелер мен қызметтерді іздеу...';

  @override
  String get searchResetFilters => 'Сүзгілерді тазарту';

  @override
  String get searchNoResults => 'Ештеңе табылмады';

  @override
  String get searchClearTooltip => 'Тазарту';

  @override
  String get searchFailed => 'Іздеу орындалмады.';

  @override
  String get searchEnterQuery => 'Атауын енгізіңіз немесе санатты таңдаңыз';

  @override
  String searchFoundCount(int count) {
    return 'Табылды: $count';
  }

  @override
  String searchNoResultsQueryCategory(String query) {
    return '«$query» сұрауы бойынша таңдалған санатта ештеңе табылмады';
  }

  @override
  String searchNoResultsQueryCity(String query, String cityName) {
    return '«$query» сұрауы бойынша $cityName қаласында ештеңе табылмады';
  }

  @override
  String searchNoInCategoryRadius(String radiusLabel) {
    return 'Таңдалған санатта $radiusLabel мекемелер жоқ';
  }

  @override
  String get searchNoInCategory => 'Таңдалған санатта мекемелер жоқ';

  @override
  String get searchRadiusWholeCity => 'Бүкіл қала';

  @override
  String searchRadiusKm(int km) {
    return '$km км дейін';
  }

  @override
  String get favoritesTitle => 'Таңдаулылар';

  @override
  String get favoritesEmpty => 'Таңдаулы орындарыңыз осында болады';

  @override
  String get favoritesGuestTitle => 'Таңдаулыларды сақтау үшін кіріңіз';

  @override
  String get favoritesGuestBody =>
      'Орындарды таңдаулыларға қосып, бір басумен оралыңыз.';

  @override
  String get favoritesRecent => 'Соңғы';

  @override
  String get favoritesByName => 'Атауы бойынша';

  @override
  String get favoritesSortLabel => 'Сұрыптау:';

  @override
  String searchRadiusKmExact(int km) {
    return '$km км';
  }

  @override
  String get mapTitle => 'Карта';

  @override
  String get mapNoBusinessesNearby => 'Жақыннан мекемелер жоқ';

  @override
  String get mapEnableLocation => 'Геолокацияны қосу';

  @override
  String get mapLoadFailed => 'Картада мекемелерді жүктеу сәтсіз';

  @override
  String get mapCloseTooltip => 'Жабу';

  @override
  String get mapDetails => 'Толығырақ';

  @override
  String get mapBusinessesOnMap => 'Картадағы мекемелер';

  @override
  String get mapNoCoordinates => 'Координаттары бар мекемелер жоқ';

  @override
  String get profileTitle => 'Профиль';

  @override
  String get profileLanguageApplyHint => 'Тіл өзгерісі бірден қолданылады.';

  @override
  String get profileLanguage => 'Тіл';

  @override
  String get profileLanguageRu => 'Русский';

  @override
  String get profileLanguageKk => 'Қазақша';

  @override
  String get profilePersonalData => 'Жеке деректер';

  @override
  String get profileMyCity => 'Менің қалам';

  @override
  String get profileMyReviews => 'Пікірлерім';

  @override
  String get profileNotifications => 'Хабарландырулар';

  @override
  String get profilePermissions => 'Менің құқықтарым';

  @override
  String get profileHelp => 'Көмек';

  @override
  String get profileAbout => 'Қолданба туралы';

  @override
  String get profileForBusiness => 'Бизнес үшін';

  @override
  String get profileFindBusiness => 'Өз бизнесіңізді табу';

  @override
  String get profileFindBusinessSubtitle => 'Карточка QalaGo-да бар болса';

  @override
  String get profileAddBusiness => 'Бизнес қосу';

  @override
  String get profileAddBusinessSubtitle => 'Жаңа өтінім жасау';

  @override
  String get profileMyBusinesses => 'Менің бизнесім';

  @override
  String get profileMyBusinessesSubtitle => 'Кабинет және басқару';

  @override
  String get profileAddMoreBusiness => 'Тағы бизнес қосу';

  @override
  String get profileFindExistingBusiness => 'Бар бизнесді табу';

  @override
  String get profileFindExistingSubtitle => 'Ие құқығын растау';

  @override
  String get profileMyApplications => 'Менің өтінімдерім';

  @override
  String get profileMyApplicationsSubtitle => 'Өтінімдер мен растау статусы';

  @override
  String get profileModeration => 'Модерация';

  @override
  String get profileModerationSubtitle =>
      'Өтінімдер мен мекеме статустарын тексеру';

  @override
  String get profileBusinessDefault => 'Бизнес';

  @override
  String get profileLogout => 'Шығу';

  @override
  String get profileSignOut => 'Аккаунттан шығу';

  @override
  String get profileGuestTitle => 'Аккаунтқа кіріңіз';

  @override
  String get profileGuestSubtitle =>
      'Таңдаулыларды сақтаңыз және пікір қалдырыңыз';

  @override
  String get profileGuestBody =>
      'Таңдаулыларды сақтаңыз, пікір қалдырыңыз және жеке функцияларды пайдаланыңыз.';

  @override
  String profileCityLabel(String name) {
    return 'Қала: $name';
  }

  @override
  String get profileDefaultUser => 'Пайдаланушы';

  @override
  String get profilePhoneMissing => 'Телефон көрсетілмеген';

  @override
  String get authLoginTitle => 'Кіру';

  @override
  String get authPhoneHint => 'Телефон нөмірі';

  @override
  String get authCodeHint => 'SMS коды';

  @override
  String get authSendCode => 'Код алу';

  @override
  String get authVerify => 'Кіру';

  @override
  String get authResendCode => 'Кодты қайта жіберу';

  @override
  String authResendIn(int seconds) {
    return 'Қайта жіберу $seconds с';
  }

  @override
  String get authContinueWithGoogle => 'Google арқылы кіру';

  @override
  String get authContinueWithApple => 'Apple арқылы кіру';

  @override
  String get authGuestContinue => 'Кірмей жалғастыру';

  @override
  String get authLoginHeading => 'QalaGo-ға кіру';

  @override
  String get authLoginSubtitle =>
      'Таңдаулыларды сақтау, пікір қалдыру және профильді басқару үшін кіріңіз.';

  @override
  String get authOrDivider => 'немесе';

  @override
  String get authLoginByPhone => 'Телефон арқылы кіру';

  @override
  String get authChangePhone => 'Нөмірді өзгерту';

  @override
  String get authPhoneInvalid => 'Телефон нөмірін тексеріңіз';

  @override
  String get authEnterSmsCode => 'SMS кодын енгізіңіз';

  @override
  String get authCodeSentAgain => 'Код қайта жіберілді';

  @override
  String authCodeSentTo(String phone) {
    return 'Код $phone нөміріне жіберілді';
  }

  @override
  String get authDevLogin => 'SMS-сыз кіру (dev)';

  @override
  String get authOtpUnavailableBody =>
      'Бұл нұсқада аккаунт арқылы кіру уақытша қолжетімсіз. Қонақ ретінде жалғастыра аласыз.';

  @override
  String get authDevOtpHint =>
      'Жергілікті әзірлеу: OTP backend debug арқылы келуі мүмкін.';

  @override
  String get authContinueWithoutAccount => 'Аккаунтсыз жалғастыру';

  @override
  String get businessCall => 'Қоңырау шалу';

  @override
  String get businessGenericName => 'Мекеме';

  @override
  String get businessLoginTitle => 'QalaGo-ға кіріңіз';

  @override
  String get businessLoginFavoriteMessage =>
      'Таңдаулыларды сақтау үшін телефон нөмірі арқылы кіріңіз.';

  @override
  String get businessLoginReviewMessage =>
      'Пікір қалдыру үшін телефон нөмірі арқылы кіріңіз.';

  @override
  String get businessReviewSent => 'Пікір жіберілді';

  @override
  String get businessAbout => 'Мекеме туралы';

  @override
  String businessAllPromotions(int count) {
    return 'Барлық акциялар ($count)';
  }

  @override
  String get businessProductsServices => 'Тауарлар мен қызметтер';

  @override
  String businessViewAllCount(int count) {
    return 'Барлығын көру ($count)';
  }

  @override
  String get businessPhotos => 'Фотосуреттер';

  @override
  String businessAllPhotos(int count) {
    return 'Барлық фото ($count)';
  }

  @override
  String get businessNoReviewsYet => 'Әлі пікірлер жоқ';

  @override
  String get businessNotFound => 'Мекеме табылмады немесе қолжетімсіз';

  @override
  String get businessLoadFailed => 'Мекеме туралы ақпаратты жүктеу сәтсіз';

  @override
  String get businessNoReviewsShort => 'Пікірлер жоқ';

  @override
  String get businessSchedule => 'Жұмыс кестесі';

  @override
  String get businessContacts => 'Байланыс';

  @override
  String get businessOnMap => 'Картада';

  @override
  String get businessBuildRoute => 'Бағыт құру';

  @override
  String get businessEdit => 'Өңдеу';

  @override
  String get businessPromotionDefault => 'Акция';

  @override
  String businessPromotionValidUntil(String date) {
    return '$date дейін';
  }

  @override
  String get catalogSearchHint => 'Тауар немесе қызметті табу';

  @override
  String get catalogPriceOnRequest => 'Баға сұрау бойынша';

  @override
  String get catalogShowMore => 'Тағы көрсету';

  @override
  String photosTotal(int count) {
    return 'Барлығы: $count';
  }

  @override
  String get photosEmpty => 'Фотосуреттер жоқ';

  @override
  String get reviewWriteRequired => 'Пікір мәтінін жазыңыз';

  @override
  String get reviewCheckTitle => 'Пікірді тексеріңіз';

  @override
  String get reviewCheckBody =>
      'Мәтін алаң ережелерін бұзуы мүмкін. Пікірді өңдеңіз немесе сол күйі жіберіңіз — модератор қолмен тексереді.';

  @override
  String get reviewEdit => 'Өңдеу';

  @override
  String get reviewSubmit => 'Жіберу';

  @override
  String get reviewRatingLabel => 'Баға';

  @override
  String get reviewYourReviewLabel => 'Сіздің пікіріңіз';

  @override
  String get reviewLeaveButton => 'Пікір қалдыру';

  @override
  String get reviewLooksOk => 'Пікір қалыпты көрінеді';

  @override
  String get reviewPossibleViolations => 'Бұзушылықтар болуы мүмкін';

  @override
  String get reviewRecommendCheck => 'Мәтінді тексеруді ұсынамыз';

  @override
  String reviewQualityScore(int score) {
    return 'Сапа бағасы: $score/100';
  }

  @override
  String get reviewLoginToLeave => 'Пікір қалдыру үшін кіріңіз';

  @override
  String get reviewLoginRequiredBody =>
      'Пікірлер авторизацияланған пайдаланушыларға қолжетімді.';

  @override
  String get notificationsTitle => 'Хабарландырулар';

  @override
  String get notificationsMarkAllRead => 'Барлығын оқу';

  @override
  String get notificationsEmpty => 'Хабарландырулар жоқ';

  @override
  String get cityNotFound => 'Қалалар табылмады';

  @override
  String citySelectedSnack(String name) {
    return 'Қала: $name';
  }

  @override
  String get onboardingFindBusinessTitle => 'Өз бизнесіңізді табу';

  @override
  String get onboardingNotFound => 'Бизнесіңізді таппадыңыз ба?';

  @override
  String get onboardingAddNew => 'Жаңа бизнес қосу';

  @override
  String get onboardingConfirmRights => 'Құқықты растау';

  @override
  String get onboardingAddBusinessTitle => 'Жаңа бизнес қосу';

  @override
  String onboardingRejectionReason(String reason) {
    return 'Бас тарту себебі: $reason';
  }

  @override
  String get onboardingOpenCabinet => 'Кабинетті ашу';

  @override
  String get onboardingDraftSaved => 'Жоба сақталды';

  @override
  String get businessRoute => 'Бағыт';

  @override
  String get businessWebsite => 'Сайт';

  @override
  String get businessShare => 'Бөлісу';

  @override
  String get businessReviews => 'Пікірлер';

  @override
  String get businessWriteReview => 'Пікір жазу';

  @override
  String get businessOpen => 'Ашық';

  @override
  String get businessClosed => 'Жабық';

  @override
  String get businessToday => 'Бүгін';

  @override
  String get businessPromotions => 'Акциялар';

  @override
  String get errorInvalidOtp => 'Қате код';

  @override
  String get errorUnauthorized => 'Кіру қажет';

  @override
  String get errorForbidden => 'Құқық жеткіліксіз';

  @override
  String get errorNotFound => 'Табылмады';

  @override
  String get errorNetwork => 'Интернет байланысын тексеріңіз';

  @override
  String get errorTimeout => 'Күту уақыты аяқталды';

  @override
  String get errorRateLimited => 'Тым көп әрекет. Кейінірек қайталап көріңіз';

  @override
  String get errorLoadFailed =>
      'Деректерді жүктеу сәтсіз. Байланысты тексеріп, қайталап көріңіз.';

  @override
  String get errorServiceUnavailable =>
      'Қызмет уақытша қолжетімсіз. Кейінірек қайталап көріңіз.';

  @override
  String get deleteAccountTitle => 'Аккаунтты жою керек пе?';

  @override
  String get deleteAccountBody =>
      'Бұл әрекетті қайтару мүмкін емес. Таңдаулылар, пікірлер және кіру жойылады. Бизнесіңіздің жалғыз иесісіз болсаңыз, алдымен басқаруды беріңіз.';

  @override
  String get deleteAccountConfirmTitle => 'Жоюды растаңыз';

  @override
  String get deleteAccountConfirmBody => 'Аккаунт қалпына келмей жойылады.';

  @override
  String get deleteAccountSuccess => 'Аккаунт жойылды';

  @override
  String get deleteAccountConflict =>
      'Жою алдында мекемені басқа иегерге беріңіз.';

  @override
  String get deleteAccountFailed =>
      'Аккаунтты жою сәтсіз. Кейінірек қайталап көріңіз.';

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count пікір',
      one: '$count пікір',
      zero: '0 пікір',
    );
    return '$_temp0';
  }

  @override
  String placesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count орын',
      one: '$count орын',
      zero: '0 орын',
    );
    return '$_temp0';
  }
}
