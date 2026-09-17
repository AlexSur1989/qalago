import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/theme/qalago_touch_targets.dart';
import 'package:qalago_mobile/features/analytics/providers/analytics_identity_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/businesses/presentation/business_details_screen.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/utils/audience_distance_bucket.dart';

import '../support/l10n_test_harness.dart';

const _businessId = 'hero-overlay-test-biz';

Map<String, dynamic> _businessFixture({
  required String nameRu,
  String? nameKk,
}) =>
    {
      'id': _businessId,
      'title': 'Hero Overlay Cafe',
      'address': 'Test street',
      'category': {'title': 'Food'},
      'city': {
        'nameRu': nameRu,
        'nameKk': nameKk ?? nameRu,
        'timezone': 'Asia/Oral',
      },
      'reviewsPreview': {'items': [], 'totalCount': 0},
    };

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        nameKk: 'Орал',
        launchStatus: 'LIVE',
      );
}

class _NoopCatalogRepository extends CatalogRepository {
  _NoopCatalogRepository() : super(Dio(BaseOptions(baseUrl: 'http://test')));

  @override
  Future<void> trackBusinessView(
    String businessId, {
    BusinessTrafficSource? trafficSource,
    String? searchQuery,
    AudienceDistanceBucket? audienceDistanceBucket,
    String? discoverySurface,
    String? visitorId,
    String? sessionId,
  }) async {}
}

Future<void> pumpHeroOverlay(
  WidgetTester tester, {
  required Map<String, dynamic> data,
  Locale locale = const Locale('ru'),
  double width = 390,
  TextScaler textScaler = TextScaler.noScaling,
}) async {
  await tester.binding.setSurfaceSize(Size(width, 900));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        cityProvider.overrideWith(() => _UralskCityNotifier()),
        authProvider.overrideWith(() => _GuestAuthNotifier()),
        catalogRepositoryProvider.overrideWith((ref) => _NoopCatalogRepository()),
        businessDetailsProvider.overrideWith((ref, id) async => data),
        businessFavoriteProvider.overrideWith((ref, id) async => false),
        myBusinessesProvider.overrideWith((ref) async => const []),
        userLocationProvider.overrideWith((ref) => Stream.value(null)),
        analyticsSessionIdProvider.overrideWith((ref) => 'test-session-id'),
        analyticsVisitorIdProvider.overrideWith(
          (ref) async => 'a' * 32,
        ),
      ],
      child: wrapWithL10n(
        MediaQuery(
          data: MediaQueryData(
            size: Size(width, 900),
            textScaler: textScaler,
          ),
          child: const BusinessDetailsScreen(id: _businessId),
        ),
        locale: locale,
      ),
    ),
  );
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 500));
}

Rect heroControlRect(WidgetTester tester, Key key) {
  return tester.getRect(find.byKey(key));
}

void expectVerticalCentersAligned(
  WidgetTester tester,
  Key leftKey,
  Key rightKey, {
  double tolerance = 3,
}) {
  final left = heroControlRect(tester, leftKey);
  final right = heroControlRect(tester, rightKey);
  expect(
    (left.center.dy - right.center.dy).abs(),
    lessThan(tolerance),
  );
}

void main() {
  group('Business detail hero overlay', () {
    Future<void> runCase(
      WidgetTester tester, {
      required double width,
      required Locale locale,
      required TextScaler textScaler,
      required String cityLabel,
    }) async {
      await pumpHeroOverlay(
        tester,
        data: _businessFixture(nameRu: cityLabel, nameKk: 'Орал'),
        locale: locale,
        width: width,
        textScaler: textScaler,
      );
      expect(tester.takeException(), isNull);

      final back = heroControlRect(tester, const Key('business_detail_hero_back'));
      final city = heroControlRect(tester, const Key('business_detail_hero_city_pill'));
      final favorite =
          heroControlRect(tester, const Key('business_detail_hero_favorite'));

      expect(back.width, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));
      expect(back.height, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));
      expect(favorite.width, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));
      expect(favorite.height, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));

      expectVerticalCentersAligned(
        tester,
        const Key('business_detail_hero_city_pill'),
        const Key('business_detail_hero_favorite'),
      );

      expect(city.right, lessThanOrEqualTo(favorite.left));
      expect(favorite.left - city.right, greaterThan(0));

      expect(back.right, lessThan(city.left));

      final screen = tester.getRect(find.byType(BusinessDetailsScreen));
      expect(city.left, greaterThanOrEqualTo(0));
      expect(favorite.right, lessThanOrEqualTo(screen.width));

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    }

    testWidgets('390 RU textScale 1.0', (tester) async {
      await runCase(
        tester,
        width: 390,
        locale: const Locale('ru'),
        textScaler: TextScaler.noScaling,
        cityLabel: 'Уральск',
      );
    });

    testWidgets('320 RU textScale 1.0', (tester) async {
      await runCase(
        tester,
        width: 320,
        locale: const Locale('ru'),
        textScaler: TextScaler.noScaling,
        cityLabel: 'Уральск',
      );
    });

    testWidgets('320 KK textScale 2.0', (tester) async {
      await runCase(
        tester,
        width: 320,
        locale: const Locale('kk'),
        textScaler: const TextScaler.linear(2),
        cityLabel: 'Орал',
      );
    });

    testWidgets('long city name RU', (tester) async {
      await runCase(
        tester,
        width: 320,
        locale: const Locale('ru'),
        textScaler: TextScaler.noScaling,
        cityLabel: 'Очень длинное название города для проверки',
      );
    });
  });
}
