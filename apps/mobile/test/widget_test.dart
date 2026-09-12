import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/app.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_catalog_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/release/app_config_models.dart';
import 'package:qalago_mobile/core/release/app_config_provider.dart';
import 'package:qalago_mobile/core/release/semver.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/home/providers/home_organic_recommendations_provider.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  testWidgets('QalaGo app smoke', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _homeSmokeOverrides,
        child: const QalaGoApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Поиск заведений и услуг...'), findsOneWidget);
  });
}

/// Release shell and home depend on network app-config; stub for widget smoke only.
final _homeSmokeOverrides = <Override>[
  appReleaseGateProvider.overrideWith(() => _ReadyReleaseGateNotifier()),
  authProvider.overrideWith(() => _GuestAuthNotifier()),
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

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(slug: 'uralsk', nameRu: 'Уральск');
}
