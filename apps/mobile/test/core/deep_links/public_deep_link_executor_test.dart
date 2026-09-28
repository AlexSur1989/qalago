import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:qalago_mobile/core/deep_links/deep_link_session_city.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_executor.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_locale.dart';
import 'package:qalago_mobile/core/deep_links/public_deep_link_target.dart';
import 'package:qalago_mobile/core/locale/app_locale_notifier.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/onboarding/onboarding_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/router/app_router.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PublicDeepLinkExecutor', () {
    late ProviderContainer container;
    late GoRouter router;
    String? lastLocation;
    late _DeepLinkTestCatalog catalog;

    ProviderContainer buildContainer() {
      router = GoRouter(
        initialLocation: '/home',
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const SizedBox()),
          GoRoute(path: '/categories', builder: (_, __) => const SizedBox()),
          GoRoute(
            path: '/categories/:categoryId',
            builder: (_, __) => const SizedBox(),
          ),
          GoRoute(path: '/search', builder: (_, __) => const SizedBox()),
          GoRoute(
            path: '/business/:businessId',
            builder: (_, __) => const SizedBox(),
          ),
        ],
      );
      router.routeInformationProvider.addListener(() {
        lastLocation = router.routeInformationProvider.value.uri.toString();
      });

      catalog = _DeepLinkTestCatalog();
      return ProviderContainer(
        overrides: [
          appRouterProvider.overrideWithValue(router),
          catalogRepositoryProvider.overrideWithValue(catalog),
          authProvider.overrideWith(_GuestAuthNotifier.new),
          cityProvider.overrideWith(_UralskCityNotifier.new),
        ],
      );
    }

    setUp(() async {
      SharedPreferences.setMockInitialValues({'selected_city_slug': 'uralsk'});
      lastLocation = null;
      container = buildContainer();
      await container.read(onboardingProvider.future);
    });

    tearDown(() {
      container.dispose();
    });

    Future<bool> execute(PublicDeepLinkTarget target) {
      return container.read(publicDeepLinkExecutorProvider).execute(target);
    }

    test('business slug resolves with link city and preserves locationId', () async {
      const loc = 'bl7085ee9a617ae8b64026db';
      final ok = await execute(
        const PublicDeepLinkBusinessTarget(
          locale: PublicDeepLinkLocale.ru,
          citySlug: 'aktobe',
          businessSlug: 'foo-cafe',
          locationId: loc,
        ),
      );
      expect(ok, isTrue);
      expect(catalog.lastBusinessBySlugCity, 'aktobe');
      expect(catalog.lastBusinessBySlugSlug, 'foo-cafe');
      expect(catalog.lastBusinessBySlugLocationId, loc);
      expect(lastLocation, contains('/business/biz-aktobe-1'));
      expect(lastLocation, contains('locationId=$loc'));
      expect(lastLocation, contains('source=DIRECT'));
      expect(container.read(cityProvider).slug, 'uralsk');
      expect(container.read(deepLinkSessionCitySlugProvider), 'aktobe');
    });

    test('business resolution failure does not navigate', () async {
      catalog.businessBySlugThrows404 = true;
      final ok = await execute(
        const PublicDeepLinkBusinessTarget(
          locale: PublicDeepLinkLocale.ru,
          citySlug: 'aktobe',
          businessSlug: 'missing',
          locationId: null,
        ),
      );
      expect(ok, isFalse);
      expect(lastLocation, isNull);
    });

    test('kk locale applied and persisted', () async {
      await execute(
        const PublicDeepLinkCityHomeTarget(
          locale: PublicDeepLinkLocale.kk,
          citySlug: 'uralsk',
        ),
      );
      expect(container.read(appLocaleProvider).languageCode, 'kk');
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(kUiLocalePrefsKey), 'kk');
    });

    test('kk locale wins over saved RU (KZ-C.1F)', () async {
      SharedPreferences.setMockInitialValues({
        kUiLocalePrefsKey: 'ru',
        'selected_city_slug': 'uralsk',
      });
      container.dispose();
      container = buildContainer();
      await container.read(onboardingProvider.future);
      await container.read(appLocaleProvider.notifier).initialHydration;
      expect(container.read(appLocaleProvider).languageCode, 'ru');

      await execute(
        const PublicDeepLinkCityHomeTarget(
          locale: PublicDeepLinkLocale.kk,
          citySlug: 'uralsk',
        ),
      );
      expect(container.read(appLocaleProvider).languageCode, 'kk');
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(kUiLocalePrefsKey), 'kk');
    });

    test('category slug resolves to category route', () async {
      final ok = await execute(
        const PublicDeepLinkCategoryTarget(
          locale: PublicDeepLinkLocale.ru,
          citySlug: 'aktobe',
          categorySlug: 'food',
        ),
      );
      expect(ok, isTrue);
      expect(catalog.lastCategoriesCity, 'aktobe');
      expect(lastLocation, '/categories/cat-food');
    });

    test('subcategory opens search with filters', () async {
      final ok = await execute(
        const PublicDeepLinkSubcategoryTarget(
          locale: PublicDeepLinkLocale.ru,
          citySlug: 'aktobe',
          categorySlug: 'food',
          subcategorySlug: 'coffee',
        ),
      );
      expect(ok, isTrue);
      expect(lastLocation, contains('/search'));
      expect(lastLocation, contains('categoryId=cat-food'));
      expect(lastLocation, contains('subcategoryId=sub-coffee'));
    });

    test('categories list route', () async {
      await execute(
        const PublicDeepLinkCategoriesTarget(
          locale: PublicDeepLinkLocale.ru,
          citySlug: 'aktobe',
        ),
      );
      expect(lastLocation, '/categories');
      expect(container.read(deepLinkSessionCitySlugProvider), 'aktobe');
    });

    test('search preserves q', () async {
      await execute(
        const PublicDeepLinkSearchTarget(
          locale: PublicDeepLinkLocale.ru,
          citySlug: 'aktobe',
          query: 'pizza',
        ),
      );
      expect(lastLocation, contains('q=pizza'));
    });

    test('city home sets session city without persisting selection', () async {
      await execute(
        const PublicDeepLinkCityHomeTarget(
          locale: PublicDeepLinkLocale.ru,
          citySlug: 'aktobe',
        ),
      );
      expect(lastLocation, '/home');
      expect(container.read(cityProvider).slug, 'uralsk');
      expect(container.read(discoveryCitySlugProvider), 'aktobe');
    });
  });
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Uralsk',
        nameKk: 'Oral',
        launchStatus: 'LIVE',
      );
}

class _DeepLinkTestCatalog extends CatalogRepository {
  _DeepLinkTestCatalog() : super(Dio(BaseOptions(baseUrl: 'http://test')));

  String? lastBusinessBySlugCity;
  String? lastBusinessBySlugSlug;
  String? lastBusinessBySlugLocationId;
  String? lastCategoriesCity;
  bool businessBySlugThrows404 = false;

  @override
  Future<Map<String, dynamic>> fetchBusinessBySlug({
    required String businessSlug,
    required String citySlug,
    String? locationId,
  }) async {
    lastBusinessBySlugCity = citySlug;
    lastBusinessBySlugSlug = businessSlug;
    lastBusinessBySlugLocationId = locationId;
    if (businessBySlugThrows404) {
      throw DioException(
        requestOptions: RequestOptions(path: '/businesses/by-slug/$businessSlug'),
        response: Response(
          requestOptions: RequestOptions(path: '/'),
          statusCode: 404,
        ),
      );
    }
    return {'id': 'biz-aktobe-1', 'slug': businessSlug};
  }

  @override
  Future<List<CategoryModel>> fetchCategories({String? citySlug}) async {
    lastCategoriesCity = citySlug;
    return [
      CategoryModel(
        id: 'cat-food',
        slug: 'food',
        title: 'Food',
        nameRu: 'Food',
        nameKk: 'Food',
        icon: 'food',
      ),
    ];
  }

  @override
  Future<List<SubcategoryModel>> fetchSubcategories(String categoryId) async {
    return [
      SubcategoryModel(
        id: 'sub-coffee',
        slug: 'coffee',
        nameRu: 'Coffee',
        nameKk: 'Coffee',
        categoryId: categoryId,
        sortOrder: 0,
      ),
    ];
  }
}
