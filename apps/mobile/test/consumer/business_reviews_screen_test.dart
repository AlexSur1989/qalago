import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/features/reviews/data/review_pagination.dart';
import 'package:qalago_mobile/features/reviews/presentation/business_reviews_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../support/l10n_test_harness.dart';

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

class _FakeCatalogRepository extends CatalogRepository {
  _FakeCatalogRepository(this._onFetch)
      : super(Dio(BaseOptions(baseUrl: 'http://test')));

  final Future<PaginatedReviews> Function({required int page}) _onFetch;

  @override
  Future<PaginatedReviews> fetchReviewsPage({
    required String businessId,
    int page = 1,
    int limit = 20,
  }) =>
      _onFetch(page: page);
}

ReviewModel _review(String id) => ReviewModel(
      id: id,
      rating: 5,
      text: 'Nice',
      userName: 'Guest',
      createdAt: '2026-01-01T00:00:00.000Z',
    );

void main() {
  testWidgets('loads page 1 and appends page 2 without duplicates', (tester) async {
    var calls = 0;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appLocaleCodeProvider.overrideWith((ref) => 'ru'),
          cityProvider.overrideWith(() => _UralskCityNotifier()),
          authProvider.overrideWith(() => _GuestAuthNotifier()),
          catalogRepositoryProvider.overrideWith(
            (ref) => _FakeCatalogRepository(({required int page}) async {
              calls++;
              if (page == 1) {
                return PaginatedReviews(
                  items: [_review('r1'), _review('r2')],
                  page: 1,
                  limit: 20,
                  total: 3,
                  totalPages: 2,
                );
              }
              return PaginatedReviews(
                items: [_review('r2'), _review('r3')],
                page: 2,
                limit: 20,
                total: 3,
                totalPages: 2,
              );
            }),
          ),
          businessDetailsProvider.overrideWith(
            (ref, request) async => {
              'id': request.businessId,
              'title': 'Test Cafe',
              'averageRating': 4.5,
              'reviewCount': 3,
            },
          ),
          myReviewForBusinessProvider.overrideWith((ref, _) async => null),
          myBusinessesProvider.overrideWith((ref) async => const []),
        ],
        child: wrapWithL10n(const BusinessReviewsScreen(businessId: 'b1')),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Test Cafe'), findsOneWidget);
    expect(find.text('Nice'), findsNWidgets(2));
    expect(find.byKey(const Key('reviews_load_more')), findsOneWidget);

    await tester.tap(find.byKey(const Key('reviews_load_more')));
    await tester.pumpAndSettle();
    expect(calls, 2);
    expect(find.text('Nice'), findsNWidgets(3));
  });

  testWidgets('initial error shows retry control', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appLocaleCodeProvider.overrideWith((ref) => 'ru'),
          cityProvider.overrideWith(() => _UralskCityNotifier()),
          authProvider.overrideWith(() => _GuestAuthNotifier()),
          catalogRepositoryProvider.overrideWith(
            (ref) => _FakeCatalogRepository(({required int page}) async {
              throw Exception('network');
            }),
          ),
          businessDetailsProvider.overrideWith(
            (ref, request) async => {
              'title': 'Cafe',
              'reviewCount': 0,
            },
          ),
          myReviewForBusinessProvider.overrideWith((ref, _) async => null),
          myBusinessesProvider.overrideWith((ref) async => const []),
        ],
        child: wrapWithL10n(const BusinessReviewsScreen(businessId: 'b1')),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Повторить'), findsOneWidget);
  });
}
