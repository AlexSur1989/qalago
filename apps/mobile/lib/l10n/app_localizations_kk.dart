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
  String get favoritesLoadFailed => 'Таңдаулыларды жүктеу сәтсіз.';

  @override
  String get favoritesRemoveTooltip => 'Таңдаулылардан алу';

  @override
  String get favoritesEmptyUser => 'Таңдаулы орындар әлі жоқ';

  @override
  String get favoritesEmptyUserHint =>
      'Орындарды таңдаулыларға қосып, оларға тез оралыңыз.';

  @override
  String favoritesEmptyInCity(String cityName) {
    return '$cityName қалasında таңдаулы орындар әлі жоқ';
  }

  @override
  String get favoritesOtherCitiesHint =>
      'Басқа қалалардағы таңдаулылар сақталды — көру үшін қаланы ауыстырыңыз.';

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
  String get commonLater => 'Кейінірек';

  @override
  String get commonUpdate => 'Жаңарту';

  @override
  String get commonSubmit => 'Жіберу';

  @override
  String get searchTitle => 'Іздеу';

  @override
  String get promotionsTitle => 'Акциялар';

  @override
  String get promotionsSearchHint => 'Акцияларды іздеу...';

  @override
  String get promotionsLoadFailed =>
      'Акцияларды жүктеу сәтсіз. Байланысты тексеріңіз.';

  @override
  String promotionsFoundCount(int count) {
    return '$count акция табылды';
  }

  @override
  String promotionsEmptyInCity(String cityName) {
    return '$cityName қаласында белсенді акциялар әлі жоқ';
  }

  @override
  String get promotionsEmptyHint =>
      'Кейінірек қайта қараңыз — мекемелер жаңа ұсыныстар қосады.';

  @override
  String get promotionsNoResultsHint =>
      'Іздеуді немесе санатты өзгертіп көріңіз.';

  @override
  String get promotionsOpenBusiness => 'Мекемені ашу';

  @override
  String get promotionExpired => 'Мерзімі өтті';

  @override
  String get sponsoredPromoted => 'Жарнамалау';

  @override
  String get adDetailsDefault => 'Толығырақ';

  @override
  String get adLabelPrefix => 'Жарнама';

  @override
  String adSemanticLabel(String title) {
    return 'Жарнама: $title';
  }

  @override
  String get cityPickerTitle => 'Қаланы таңдаңыз';

  @override
  String get cityComingSoon => 'Жақында';

  @override
  String get cityCurrent => 'Ағымдағы қала';

  @override
  String get cityTapToSelect => 'Таңдау үшін басыңыз';

  @override
  String get cityLoadFailed => 'Қалалар тізімін жүктеу сәтсіз';

  @override
  String emptyCityComingTitle(String cityName) {
    return '$cityName жақында ашылады';
  }

  @override
  String emptyCitySoonTitle(String cityName) {
    return '$cityName жақында QalaGo-да';
  }

  @override
  String get emptyCityComingBody =>
      'Қаланы QalaGo-да іске қосуға дайындаламыз. Мекемені алдын ала қосыңыз немесе басқа қаланы таңдаңыз.';

  @override
  String get emptyCityEmptyBody =>
      'Мекемелер мен қызметтерді қосамыз. Кatalog әлі бос — басқа қаланы таңдаңыз немесе өз орныңызды ұсыныңыз.';

  @override
  String get emptyCityPickOther => 'Басқа қаланы таңдау';

  @override
  String get emptyCityAddBusiness => 'Мекеме қосу';

  @override
  String get legalSectionTitle => 'Құқықтық ақпарат';

  @override
  String get legalPrivacy => 'Құпиялылық саясаты';

  @override
  String get legalTerms => 'Пайдалану шарттары';

  @override
  String get legalConsentPrefix => 'Жалғастыру арқылы сіз ';

  @override
  String get legalConsentTerms => 'Пайдалану шарттарын';

  @override
  String get legalConsentAnd => ' қабылдайсыз және ';

  @override
  String get legalConsentPrivacy => 'Құпиялылық саясатымен';

  @override
  String get releaseUpdateAvailable => 'Жаңарту қолжетімді';

  @override
  String get releaseRequiredBody =>
      'Жалғастыру үшін қолданбаның жаңа нұсқасын орнатыңыз.';

  @override
  String get releaseOptionalBody => 'QalaGo-дың жаңа нұсқасы қолжетімді.';

  @override
  String get releaseStoreMissing => 'Дүкен сілтемесі әлі бапталмаған.';

  @override
  String get profilePermissionsAllowed => 'Болады';

  @override
  String get profilePermissionsDenied => 'Болмайды';

  @override
  String profilePermissionsApps(String apps) {
    return 'Қолданбалар: $apps';
  }

  @override
  String profilePermissionsModerationCity(String city) {
    return 'Модерация қаласы: $city';
  }

  @override
  String get profileDevTestAccounts => 'Тест аккаунттары (dev)';

  @override
  String get profileDevOtpHint => 'OTP коды: 1234';

  @override
  String get profileReviewsEmpty => 'Сіз әлі пікір қалдырмадыңыз';

  @override
  String get profileReviewsEmptyHint =>
      'Мекеме карточкасын ашып, впечатлениеңізбен бөлісіңіз';

  @override
  String get profileReviewsGoHome => 'Басты бетке';

  @override
  String get profileBusinessReply => 'Мекеме жауабы';

  @override
  String get profileOpenBusiness => 'Мекемені ашу';

  @override
  String get profileHelpFaqTitle => 'Жиі қойылатын сұрақтар';

  @override
  String get profileHelpNeedSupport => 'Көмек керек пе?';

  @override
  String get profileHelpSupportBody =>
      'Қолданба жұмысы бойынша сұрақтар болса, QalaGo ресми арналары арқылы қолдауға хабарласыңыз.';

  @override
  String get profileHelpTagline =>
      'QalaGo — қалалық гид және маркетплейс. MVP Уральскте іске қосылды.';

  @override
  String get profileHelpFaq1Q => 'Мекемені қалай қосуға болады?';

  @override
  String get profileHelpFaq1A =>
      'Профильде «Мекеме қосу» таңдап, форманы толтырып, модерацияны күтіңіз.';

  @override
  String get profileHelpFaq2Q => 'Қаланы қалай ауыстыруға болады?';

  @override
  String get profileHelpFaq2A =>
      'Басты бетте немесе профильде қала атауын басыңыз → «Менің қалам». Аккаунт үшін қала бұлтта сақталады.';

  @override
  String get profileHelpFaq3Q => 'Пікір қалай қалдыруға болады?';

  @override
  String get profileHelpFaq3A =>
      'Мекеме карточкасын ашып, пікірлер бөліміне дейін айналдырып, «Пікір қалдыру» басыңыз.';

  @override
  String get profileHelpFaq4Q => 'Кіріс коды келмейді';

  @override
  String get profileHelpFaq4A =>
      'Телефон нөмірін тексеріп, бір минут күтіңіз. Код келмесе, кіру экранында «Кодты қайта жіберу» басыңыз.';

  @override
  String get profileAboutVersion => 'Нұсқа 1.0.0 (MVP)';

  @override
  String get profileAboutDescription =>
      'QalaGo — қалалық super-app: мекемелер каталогы, акциялар, карта, пікірлер және бизнес кабинеті.';

  @override
  String get profileAboutMvpCityLabel => 'MVP қаласы';

  @override
  String get profileAboutMvpCityValue => 'Орал';

  @override
  String get profileAboutRegionLabel => 'Аймақ';

  @override
  String get profileAboutRegionValue => 'Қазақстан';

  @override
  String get profileAboutLanguagesLabel => 'Тілдер';

  @override
  String get profileAboutLanguagesValue => 'Русский · Қазақша';

  @override
  String profileAboutCopyright(int year) {
    return '© $year QalaGo. Барлық құқықтар қорғалған.';
  }

  @override
  String get profileEditNameRequired => 'Атыңызды енгізіңіз';

  @override
  String get profileEditSaved => 'Сақталды';

  @override
  String get profileEditNameLabel => 'Аты';

  @override
  String get profileEditNameHint => 'Сізге қалай жүгіну керек';

  @override
  String get profileEditPhoneLabel => 'Телефон';

  @override
  String get profileEditPhoneHelp =>
      'Телефон нөмірін қолдау арқылы немесе қайта тіркелу арқылы өзгертуге болады';

  @override
  String get profileEditChangePhoto => 'Фото өзгерту';

  @override
  String get profileEditTakePhoto => 'Камерадан';

  @override
  String get profileEditFromGallery => 'Галереядан';

  @override
  String get profileEditRemovePhoto => 'Фото жою';

  @override
  String get profileEditAvatarUpdated => 'Фото жаңартылды';

  @override
  String get profileEditAvatarRemoved => 'Фото жойылды';

  @override
  String get profileEditAvatarFailed => 'Фото жүктеу сәтсіз';

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
  String get businessInstagram => 'Instagram';

  @override
  String get businessAddress => 'Мекенжай';

  @override
  String get catalogNotFound => 'Ештеңе табылмады';

  @override
  String get onboardingForBusinessTitle => 'Бизнес үшін';

  @override
  String get onboardingIntro =>
      'Өз бизнесіңізді қосыңыз немесе табыңыз. QalaGo-да бар болса, жаңа карточка жасамай, кіру сұраңыз.';

  @override
  String get onboardingSearchLabel => 'Атауы немесе мекенжайы';

  @override
  String get onboardingSearchAction => 'Іздеу';

  @override
  String get onboardingSearching => 'Іздеу…';

  @override
  String get onboardingApplyIntro =>
      'Өтінім QalaGo әкімшілігі тексереді. Кабинетке кіру мақұлданғаннан кейін ашылады.';

  @override
  String get onboardingNameLabel => 'Атауы *';

  @override
  String get onboardingNameRequired => 'Атауын енгізіңіз';

  @override
  String get onboardingCategoryLabel => 'Санат *';

  @override
  String get onboardingAddressLabel => 'Мекенжай *';

  @override
  String get onboardingAddressRequired => 'Мекенжайды енгізіңіз';

  @override
  String get onboardingPhoneLabel => 'Телефон';

  @override
  String get onboardingDescriptionLabel => 'Қысқаша сипаттама';

  @override
  String get onboardingSaveDraft => 'Жобаны сақтау';

  @override
  String get onboardingSubmitReview => 'Тексеруге жіберу';

  @override
  String get onboardingSaving => 'Сақталуда…';

  @override
  String get onboardingSubmitting => 'Жіберілуде…';

  @override
  String get onboardingSubmitted => 'Өтінім тексеруге жіберілді';

  @override
  String get onboardingClaimSentTitle => 'Өтінім жіберілді';

  @override
  String get onboardingClaimSentBody => 'Тексеру нәтижесін хабарлаймыз.';

  @override
  String get onboardingClaimTitle => 'Ие құқығын растау';

  @override
  String get onboardingClaimIntro => 'Өтінім QalaGo әкімшілігі тексереді.';

  @override
  String get onboardingClaimMessageLabel =>
      'Модераторға хабарлама (міндетті емес)';

  @override
  String get onboardingClaimSubmit => 'Өтінім жіберу';

  @override
  String get onboardingClaimsTitle => 'Құқықты растау';

  @override
  String get onboardingClaimsEmpty => 'Растау өтінімдері әлі жоқ';

  @override
  String get onboardingApplicationsTitle => 'Менің өтінімдерім';

  @override
  String get onboardingApplicationsEmpty => 'Өтінімдер әлі жоқ';

  @override
  String get onboardingAddBusinessBtn => 'Бизнес қосу';

  @override
  String onboardingReasonPrefix(String reason) {
    return 'Себебі: $reason';
  }

  @override
  String get onboardingStatusDraft => 'Жоба';

  @override
  String get onboardingStatusPending => 'Тексеруде';

  @override
  String get onboardingStatusApproved => 'Мақұлданды';

  @override
  String get onboardingStatusRejected => 'Бас тартылды';

  @override
  String get onboardingStatusCancelled => 'Болдырылмады';

  @override
  String get onboardingRoleOwner => 'Иесі';

  @override
  String get onboardingRoleManager => 'Менеджер';

  @override
  String get onboardingErrorConflict =>
      'Өтінім жіберілген немесе статус өзгерді. Бетті жаңартыңыз.';

  @override
  String get onboardingErrorDuplicate =>
      'Ұқсас бизнес QalaGo-да бар. Барын табуға тырысыңыз.';

  @override
  String get onboardingErrorAlreadyOwner => 'Бұл бизнес иесінің құқығыңыз бар.';

  @override
  String get onboardingErrorForbidden =>
      'Кіру шектеулі. Әкімшіге хабарласыңыз.';

  @override
  String get onboardingErrorGeneric => 'Әрекет орындалмады. Қайталап көріңіз.';

  @override
  String get claimCtaLoginTitle => 'Кіріңіз';

  @override
  String get claimCtaLoginMessage =>
      'Ие құқығын растау үшін аккаунтқа кіріңіз.';

  @override
  String get claimCtaYourBusiness => 'Бұл сіздің бизнесіңіз бе?';

  @override
  String get claimCtaPending => 'Растау өтінімі жіберілді';

  @override
  String get claimCtaConfirmOwner => 'Ие құқығын растау';

  @override
  String get defaultSearchHint => 'Іздеу...';

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
  String get deleteAccountButton => 'Аккаунтты жою';

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
