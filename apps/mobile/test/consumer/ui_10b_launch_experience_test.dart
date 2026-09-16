import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:qalago_mobile/app.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/locale/app_locale_notifier.dart';
import 'package:qalago_mobile/core/onboarding/onboarding_prefs.dart';
import 'package:qalago_mobile/core/onboarding/onboarding_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/providers/city_catalog_provider.dart';
import 'package:qalago_mobile/core/release/app_config_models.dart';
import 'package:qalago_mobile/core/release/app_config_provider.dart';
import 'package:qalago_mobile/core/release/semver.dart';
import 'package:qalago_mobile/core/release/app_release_shell.dart';
import 'package:qalago_mobile/core/release/release_gate_screens.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/home/presentation/home_screen.dart';
import 'package:qalago_mobile/features/home/providers/home_organic_recommendations_provider.dart';
import 'package:qalago_mobile/features/onboarding/presentation/onboarding_city_screen.dart';
import 'package:qalago_mobile/features/onboarding/presentation/welcome_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/widgets/qalago_logo.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../support/l10n_test_harness.dart';
import '../support/onboarding_test_support.dart';

class _ReadyReleaseGateNotifier extends AppReleaseGateNotifier {
  @override
  Future<AppReleaseGateState> build() async {
    return AppReleaseGateState(
      loading: false,
      config: AppConfigSnapshot(
        configRevision: 1,
        maintenanceEnabled: false,
        updateMode: ClientUpdateMode.none,
        featureFlags: const {},
        fetchedAt: DateTime(2026, 1, 1),
      ),
    );
  }
}

class _MaintenanceReleaseGateNotifier extends AppReleaseGateNotifier {
  @override
  Future<AppReleaseGateState> build() async {
    return AppReleaseGateState(
      loading: false,
      config: AppConfigSnapshot(
        configRevision: 1,
        maintenanceEnabled: true,
        updateMode: ClientUpdateMode.none,
        featureFlags: const {},
        fetchedAt: DateTime(2026, 1, 1),
      ),
    );
  }
}

class _RequiredUpdateReleaseGateNotifier extends AppReleaseGateNotifier {
  @override
  Future<AppReleaseGateState> build() async {
    return AppReleaseGateState(
      loading: false,
      config: AppConfigSnapshot(
        configRevision: 1,
        maintenanceEnabled: false,
        updateMode: ClientUpdateMode.required,
        featureFlags: const {},
        fetchedAt: DateTime(2026, 1, 1),
      ),
    );
  }
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _AuthedUserNotifier extends AuthNotifier {
  @override
  AuthState build() => AuthState(
        isLoading: false,
        user: UserModel(
          id: 'u1',
          email: 'a@b.kz',
          role: 'USER',
        ),
      );
}

class _OwnerAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => AuthState(
        isLoading: false,
        user: UserModel(
          id: 'u1',
          email: 'owner@test.kz',
          role: 'OWNER',
        ),
      );
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        nameKk: 'Орал',
        launchStatus: 'LIVE',
        centerLat: 51.2278,
        centerLng: 51.3865,
      );
}

List<Override> _homeDataOverrides = [
  cityProvider.overrideWith(() => _UralskCityNotifier()),
  cityCatalogTotalProvider.overrideWith((ref) async => 5),
  categoriesProvider.overrideWith((ref) async => <CategoryModel>[]),
  promotionsProvider.overrideWith(
    (ref) async => PaginatedPromotions(items: []),
  ),
  homeOrganicRecommendationsProvider.overrideWith((ref) async => []),
  businessesProvider.overrideWith(
    (ref, query) async => PaginatedBusinesses(items: [], total: 0),
  ),
  unreadNotificationsProvider.overrideWith((ref) async => 0),
  userLocationProvider.overrideWith((ref) => Stream.value(null)),
];

List<Map<String, dynamic>> _mockCities() => [
      {
        'id': 'c1',
        'slug': 'uralsk',
        'nameRu': 'Уральск',
        'nameKk': 'Орал',
        'launchStatus': 'LIVE',
        'centerLat': 51.2278,
        'centerLng': 51.3865,
      },
      {
        'id': 'c2',
        'slug': 'aktobe',
        'nameRu': 'Актобе',
        'nameKk': 'Ақтөбе',
        'launchStatus': 'COMING_SOON',
      },
    ];

Future<void> _pumpApp(
  WidgetTester tester, {
  List<Override> overrides = const [],
  bool firstLaunch = false,
}) async {
  if (firstLaunch) {
    await seedFirstLaunchOnboarding();
  } else {
    await seedReturningUserOnboarding();
  }

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        appReleaseGateProvider.overrideWith(() => _ReadyReleaseGateNotifier()),
        authProvider.overrideWith(() => _GuestAuthNotifier()),
        citiesProvider.overrideWith((ref) async => _mockCities()),
        ..._homeDataOverrides,
        ...overrides,
      ],
      child: const QalaGoApp(),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(() async {
    userLocationGeolocator = const UserLocationGeolocatorBridge();
  });

  testWidgets('first launch shows Welcome', (tester) async {
    await _pumpApp(tester, firstLaunch: true);
    expect(find.byType(WelcomeScreen), findsOneWidget);
    expect(find.text('Ваш город рядом'), findsOneWidget);
  });

  testWidgets('Welcome to City to Home flow completes onboarding', (tester) async {
    await _pumpApp(tester, firstLaunch: true);
    await tester.tap(find.text('Начать'));
    await tester.pumpAndSettle();
    expect(find.byType(OnboardingCityScreen), findsOneWidget);
    await tester.tap(find.text('Продолжить'));
    await tester.pumpAndSettle();
    expect(find.text('Поиск заведений и услуг...'), findsOneWidget);

    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool(OnboardingPrefs.completedKey), isTrue);
    expect(prefs.getInt(OnboardingPrefs.versionKey),
        OnboardingPrefs.currentVersion);
  });

  testWidgets('returning guest skips onboarding to Home', (tester) async {
    await _pumpApp(tester);
    expect(find.byType(WelcomeScreen), findsNothing);
    expect(find.text('Поиск заведений и услуг...'), findsOneWidget);
  });

  testWidgets('returning authenticated user skips onboarding', (tester) async {
    await _pumpApp(
      tester,
      overrides: [
        authProvider.overrideWith(() => _AuthedUserNotifier()),
      ],
    );
    expect(find.byType(WelcomeScreen), findsNothing);
    expect(find.text('Поиск заведений и услуг...'), findsOneWidget);
  });

  testWidgets('OWNER cold start lands on consumer Home not owner cabinet',
      (tester) async {
    await seedReturningUserOnboarding();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appReleaseGateProvider.overrideWith(() => _ReadyReleaseGateNotifier()),
          authProvider.overrideWith(() => _OwnerAuthNotifier()),
          citiesProvider.overrideWith((ref) async => _mockCities()),
          ..._homeDataOverrides,
        ],
        child: const QalaGoApp(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Поиск заведений и услуг...'), findsOneWidget);
    expect(find.textContaining('Кабинет'), findsNothing);
  });

  testWidgets('KK language selection persists on Welcome', (tester) async {
    await _pumpApp(tester, firstLaunch: true);
    await tester.tap(find.text('Қазақша'));
    await tester.pumpAndSettle();
    expect(find.text('Қалаңыз жаныңызда'), findsOneWidget);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString(kUiLocalePrefsKey), 'kk');
  });

  testWidgets('RU language selection persists on Welcome', (tester) async {
    await _pumpApp(tester, firstLaunch: true);
    await tester.tap(find.text('Қазақша'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Русский'));
    await tester.pumpAndSettle();
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString(kUiLocalePrefsKey), 'ru');
  });

  testWidgets('Welcome 320 KK textScale 2.0 no overflow', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);

    await seedFirstLaunchOnboarding();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appReleaseGateProvider.overrideWith(() => _ReadyReleaseGateNotifier()),
          authProvider.overrideWith(() => _GuestAuthNotifier()),
          citiesProvider.overrideWith((ref) async => _mockCities()),
        ],
        child: MediaQuery(
          data: const MediaQueryData(
            size: Size(320, 640),
            textScaler: TextScaler.linear(2),
          ),
          child: wrapWithL10n(
            const WelcomeScreen(),
            locale: const Locale('kk'),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('Бастау'), findsOneWidget);
  });

  testWidgets('City onboarding 320 KK textScale 2.0 no overflow', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);

    await seedFirstLaunchOnboarding();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          citiesProvider.overrideWith((ref) async => _mockCities()),
        ],
        child: MediaQuery(
          data: const MediaQueryData(
            size: Size(320, 640),
            textScaler: TextScaler.linear(2),
          ),
          child: wrapWithL10n(
            const OnboardingCityScreen(),
            locale: const Locale('kk'),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('Жалғастыру'), findsOneWidget);
  });

  testWidgets('Header logo 320 KK textScale 2.0', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      wrapWithL10n(
        MediaQuery(
          data: const MediaQueryData(
            size: Size(320, 640),
            textScaler: TextScaler.linear(2),
          ),
          child: const SizedBox(
            width: 320,
            child: QalaGoLogo(height: 26, fit: true),
          ),
        ),
        locale: const Locale('kk'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(QalaGoLogo), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('maintenance blocks onboarding', (tester) async {
    await seedFirstLaunchOnboarding();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appReleaseGateProvider.overrideWith(
            () => _MaintenanceReleaseGateNotifier(),
          ),
        ],
        child: const AppReleaseShell(child: SizedBox()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(MaintenanceScreen), findsOneWidget);
    expect(find.byType(WelcomeScreen), findsNothing);
  });

  testWidgets('required update blocks onboarding', (tester) async {
    await seedFirstLaunchOnboarding();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appReleaseGateProvider.overrideWith(
            () => _RequiredUpdateReleaseGateNotifier(),
          ),
        ],
        child: const AppReleaseShell(child: SizedBox()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(RequiredUpdateScreen), findsOneWidget);
  });

  testWidgets('release gate error fail-open shows child not trapped',
      (tester) async {
    await seedFirstLaunchOnboarding();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appReleaseGateProvider.overrideWith(
            () => _ErrorReleaseGateNotifier(),
          ),
        ],
        child: const MaterialApp(home: Text('child-visible')),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('child-visible'), findsOneWidget);
  });

  test('passive user location stream does not request permission', () async {
    var requestCount = 0;
    userLocationGeolocator = _FakeGeolocator(
      onRequest: () {
        requestCount++;
        return Future.value(LocationPermission.denied);
      },
    );

    final events = <UserPosition?>[];
    final sub = userLocationStream(
      permissionMode: UserLocationPermissionMode.passive,
    ).listen(events.add);

    await Future<void>.delayed(Duration.zero);
    await sub.cancel();

    expect(requestCount, 0);
    expect(events, [null]);
  });

  testWidgets('City back returns to Welcome', (tester) async {
    await _pumpApp(tester, firstLaunch: true);
    await tester.tap(find.text('Начать'));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(WelcomeScreen), findsOneWidget);
  });

  test('readOnboardingFromPrefs requires when version outdated', () async {
    SharedPreferences.setMockInitialValues(
      returningUserOnboardingPrefs(version: 0, completed: true),
    );
    final prefs = await SharedPreferences.getInstance();
    expect(readOnboardingFromPrefs(prefs).requiresOnboarding, isTrue);
  });

  testWidgets('Home cold render does not request location permission',
      (tester) async {
    var requestCount = 0;
    userLocationGeolocator = _FakeGeolocator(
      onRequest: () {
        requestCount++;
        return Future.value(LocationPermission.denied);
      },
    );

    await seedReturningUserOnboarding();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => _GuestAuthNotifier()),
          citiesProvider.overrideWith((ref) async => _mockCities()),
          ..._homeDataOverrides,
          userLocationProvider.overrideWith(
            (ref) => userLocationStream(
              permissionMode: UserLocationPermissionMode.passive,
            ),
          ),
        ],
        child: wrapWithL10n(const HomeScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(requestCount, 0);
  });
}

class _ErrorReleaseGateNotifier extends AppReleaseGateNotifier {
  @override
  Future<AppReleaseGateState> build() async {
    throw StateError('network');
  }
}

class _FakeGeolocator extends UserLocationGeolocatorBridge {
  _FakeGeolocator({required this.onRequest});

  final Future<LocationPermission> Function() onRequest;

  @override
  Future<bool> isLocationServiceEnabled() async => true;

  @override
  Future<LocationPermission> checkPermission() async =>
      LocationPermission.denied;

  @override
  Future<LocationPermission> requestPermission() => onRequest();

  @override
  Future<Position> getCurrentPosition() async {
    throw UnsupportedError('not expected');
  }

  @override
  Stream<Position> positionStream() => const Stream.empty();
}
