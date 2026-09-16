import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/analytics/providers/analytics_identity_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/businesses/presentation/business_details_screen.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/utils/audience_distance_bucket.dart';

import '../support/l10n_test_harness.dart';

const _businessId = 'detail-test-biz';

Map<String, dynamic> _fullIntentFixture() => {
      'id': _businessId,
      'title': 'QalaGo Demo Cafe',
      'address': 'Abay Avenue 10, Uralsk',
      'phone': '+77001234567',
      'whatsapp': '77001234567',
      'latitude': 51.2278,
      'longitude': 51.3865,
      'category': {'title': 'Кофейни'},
      'city': {
        'nameRu': 'Уральск',
        'nameKk': 'Орал',
        'timezone': 'Asia/Oral',
      },
      'reviewsPreview': {'items': [], 'totalCount': 0},
    };

Map<String, dynamic> _minimalFixture() => {
      'id': _businessId,
      'title': 'Minimal Place',
      'address': '',
      'category': {'title': 'Services'},
      'city': {
        'nameRu': 'Уральск',
        'nameKk': 'Орал',
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

class _DetailTestCatalogRepository extends CatalogRepository {
  _DetailTestCatalogRepository() : super(Dio(BaseOptions(baseUrl: 'http://test')));

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

  @override
  Future<void> trackCallClick(String businessId,
          {String? sessionId, String? visitorId}) async {}

  @override
  Future<void> trackWhatsappClick(String businessId,
          {String? sessionId, String? visitorId}) async {}

  @override
  Future<void> trackRouteClick(String businessId,
          {String? sessionId, String? visitorId}) async {}
}

Future<void> _pumpBusinessDetail(
  WidgetTester tester, {
  required Map<String, dynamic> data,
  Locale locale = const Locale('ru'),
  double width = 320,
  TextScaler textScaler = TextScaler.noScaling,
}) async {
  await tester.binding.setSurfaceSize(Size(width, 900));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        cityProvider.overrideWith(() => _UralskCityNotifier()),
        authProvider.overrideWith(() => _GuestAuthNotifier()),
        catalogRepositoryProvider.overrideWith(
          (ref) => _DetailTestCatalogRepository(),
        ),
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

Future<void> _disposeDetailTimers(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(milliseconds: 700));
}

void main() {
  group('Business Detail primary intents — responsive', () {
    testWidgets('320 KK textScale 2.0 shows Call, WhatsApp, Route', (tester) async {
      await _pumpBusinessDetail(
        tester,
        data: _fullIntentFixture(),
        locale: const Locale('kk'),
        width: 320,
        textScaler: const TextScaler.linear(2.0),
      );

      expect(tester.takeException(), isNull);
      expect(find.text('Қоңырау шалу'), findsOneWidget);
      expect(find.text('WhatsApp'), findsOneWidget);
      expect(find.text('Бағыт'), findsOneWidget);
      await _disposeDetailTimers(tester);
    });

    testWidgets('320 RU textScale 2.0 three primary actions', (tester) async {
      await _pumpBusinessDetail(
        tester,
        data: _fullIntentFixture(),
        locale: const Locale('ru'),
        width: 320,
        textScaler: const TextScaler.linear(2.0),
      );

      expect(tester.takeException(), isNull);
      expect(find.text('Позвонить'), findsOneWidget);
      expect(find.text('WhatsApp'), findsOneWidget);
      expect(find.text('Маршрут'), findsOneWidget);
      await _disposeDetailTimers(tester);
    });

    testWidgets('360 KK textScale 2.0 primary actions', (tester) async {
      await _pumpBusinessDetail(
        tester,
        data: _fullIntentFixture(),
        locale: const Locale('kk'),
        width: 360,
        textScaler: const TextScaler.linear(2.0),
      );
      expect(tester.takeException(), isNull);
      expect(find.text('Қоңырау шалу'), findsOneWidget);
      await _disposeDetailTimers(tester);
    });

    testWidgets('390 KK textScale 1.3 primary actions', (tester) async {
      await _pumpBusinessDetail(
        tester,
        data: _fullIntentFixture(),
        locale: const Locale('kk'),
        width: 390,
        textScaler: const TextScaler.linear(1.3),
      );
      expect(tester.takeException(), isNull);
      expect(find.text('Бағыт'), findsOneWidget);
      await _disposeDetailTimers(tester);
    });

    testWidgets('430 RU textScale 1.0 primary actions', (tester) async {
      await _pumpBusinessDetail(
        tester,
        data: _fullIntentFixture(),
        locale: const Locale('ru'),
        width: 430,
      );
      expect(tester.takeException(), isNull);
      expect(find.text('Маршрут'), findsOneWidget);
      await _disposeDetailTimers(tester);
    });
  });

  group('Business Detail minimal fixture', () {
    testWidgets('renders title without empty contact or intent shells',
        (tester) async {
      await _pumpBusinessDetail(
        tester,
        data: _minimalFixture(),
        width: 320,
      );

      expect(tester.takeException(), isNull);
      expect(find.text('Minimal Place'), findsOneWidget);
      expect(find.text('Позвонить'), findsNothing);
      expect(find.text('WhatsApp'), findsNothing);
      expect(find.text('Маршрут'), findsNothing);
      expect(find.text('Контакты'), findsNothing);
      expect(find.text('О заведении'), findsNothing);
      await _disposeDetailTimers(tester);
    });
  });
}
