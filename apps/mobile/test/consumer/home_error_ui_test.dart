import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_catalog_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/home/presentation/home_screen.dart';
import 'package:qalago_mobile/features/home/providers/home_organic_recommendations_provider.dart';
import 'package:qalago_mobile/shared/utils/network_error_utils.dart';

void main() {
  testWidgets('Home shows friendly network error without raw DioException', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => _GuestAuthNotifier()),
          cityProvider.overrideWith(() => _UralskCityNotifier()),
          categoriesProvider.overrideWith((ref) async {
            throw DioException(
              requestOptions: RequestOptions(path: '/categories'),
              type: DioExceptionType.connectionError,
              message: 'XMLHttpRequest onError callback was called',
            );
          }),
          cityCatalogTotalProvider.overrideWith((ref) async => 10),
          promotionsProvider.overrideWith((ref) async {
            throw DioException(
              requestOptions: RequestOptions(path: '/promotions'),
              type: DioExceptionType.connectionError,
            );
          }),
          homeOrganicRecommendationsProvider.overrideWith((ref) async {
            throw DioException(
              requestOptions: RequestOptions(path: '/recommendations'),
              type: DioExceptionType.connectionError,
            );
          }),
          businessesProvider.overrideWith((ref, query) async {
            throw DioException(
              requestOptions: RequestOptions(path: '/businesses'),
              type: DioExceptionType.connectionError,
            );
          }),
          unreadNotificationsProvider.overrideWith((ref) async => 0),
          userLocationProvider.overrideWith((ref) => Stream.value(null)),
        ],
        child: const MaterialApp(home: HomeScreen()),
      ),
    );
    await tester.pumpAndSettle();

    final friendly = mapUserFacingLoadError(
      DioException(
        requestOptions: RequestOptions(path: '/x'),
        type: DioExceptionType.connectionError,
      ),
    );

    expect(find.textContaining(friendly), findsWidgets);
    expect(find.textContaining('DioException'), findsNothing);
    expect(find.textContaining('XMLHttpRequest'), findsNothing);
    expect(find.text('Повторить'), findsWidgets);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(slug: 'uralsk', nameRu: 'Уральск');
}
