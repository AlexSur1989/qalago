import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/utils/consumer_discovery_utils.dart';

void main() {
  group('filterActivePromotionModels', () {
    test('excludes expired promotion', () {
      final items = [
        PromotionModel(
          id: 'p1',
          title: 'Active',
          endDate: DateTime.now().toUtc().add(const Duration(days: 2)),
        ),
        PromotionModel(
          id: 'p2',
          title: 'Expired',
          endDate: DateTime.now().toUtc().subtract(const Duration(days: 1)),
        ),
      ];

      final filtered = filterActivePromotionModels(items);
      expect(filtered, hasLength(1));
      expect(filtered.first.id, 'p1');
    });

    test('excludes not-yet-started promotion', () {
      final items = [
        PromotionModel(
          id: 'p1',
          title: 'Future',
          startDate: DateTime.now().toUtc().add(const Duration(days: 3)),
        ),
      ];
      expect(filterActivePromotionModels(items), isEmpty);
    });
  });

  group('formatPromotionValidity', () {
    test('shows expiry date when endDate present', () {
      final promo = PromotionModel(
        id: 'p1',
        title: 'Sale',
        endDate: DateTime(2026, 9, 15),
      );
      expect(formatPromotionValidity(promo), contains('15'));
      expect(formatPromotionValidity(promo), contains('сентября'));
    });

    test('shows active label when no endDate', () {
      final promo = PromotionModel(id: 'p1', title: 'Sale');
      expect(formatPromotionValidity(promo), 'Активно сейчас');
    });
  });

  group('favorites city filter', () {
    final allFavorites = [
      {
        'id': 'f1',
        'createdAt': '2026-09-01T00:00:00.000Z',
        'business': {
          'id': 'b1',
          'title': 'Uralsk Cafe',
          'slug': 'uralsk-cafe',
          'address': 'A',
          'city': {'slug': 'uralsk', 'nameRu': 'Уральск'},
        },
      },
      {
        'id': 'f2',
        'createdAt': '2026-08-01T00:00:00.000Z',
        'business': {
          'id': 'b2',
          'title': 'Aktobe Shop',
          'slug': 'aktobe-shop',
          'address': 'B',
          'city': {'slug': 'aktobe', 'nameRu': 'Актобе'},
        },
      },
    ];

    test('filters favorites by selected city', () {
      final uralsk = filterFavoritesByCity(allFavorites, 'uralsk');
      expect(uralsk, hasLength(1));
      expect(
        (uralsk.first['business'] as Map)['id'],
        'b1',
      );
    });

    test('other city favorites remain in full list', () {
      expect(allFavorites, hasLength(2));
      expect(filterFavoritesByCity(allFavorites, 'aktobe'), hasLength(1));
    });

    test('recent sort preserves API order', () {
      final sorted = sortFavorites(allFavorites, FavoriteSortMode.recent);
      expect(
        (sorted.first['business'] as Map)['id'],
        'b1',
      );
    });

    test('name sort orders alphabetically', () {
      final sorted = sortFavorites(allFavorites, FavoriteSortMode.name);
      expect(
        (sorted.first['business'] as Map)['title'],
        'Aktobe Shop',
      );
    });
  });

  group('map helpers', () {
    test('businessesWithoutCoordinates are skipped', () {
      final items = [
        BusinessModel(
          id: 'b1',
          title: 'With coords',
          slug: 'a',
          address: 'A',
          latitude: 51.2,
          longitude: 51.3,
        ),
        BusinessModel(
          id: 'b2',
          title: 'No coords',
          slug: 'b',
          address: 'B',
        ),
      ];
      expect(businessesWithCoordinates(items), hasLength(1));
      expect(businessesWithCoordinates(items).first.id, 'b1');
    });

    test('mapInitialCenter uses city when user far away', () {
      final center = mapInitialCenter(
        cityCenterLat: 51.23,
        cityCenterLng: 51.38,
        userLat: 43.25,
        userLng: 76.95,
      );
      expect(center.lat, 51.23);
      expect(center.lng, 51.38);
    });

    test('mapInitialCenter uses user when near city', () {
      final center = mapInitialCenter(
        cityCenterLat: 51.23,
        cityCenterLng: 51.38,
        userLat: 51.24,
        userLng: 51.39,
      );
      expect(center.lat, 51.24);
      expect(center.lng, 51.39);
    });

    test('mapInitialCenter falls back to city when GPS denied', () {
      final center = mapInitialCenter(
        cityCenterLat: 51.23,
        cityCenterLng: 51.38,
        userLat: null,
        userLng: null,
      );
      expect(center.lat, 51.23);
      expect(center.lng, 51.38);
    });
  });
}
