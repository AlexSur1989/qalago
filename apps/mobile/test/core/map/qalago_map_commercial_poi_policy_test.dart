import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_commercial_poi_policy.dart';

void main() {
  group('QalaGoMapCommercialPoiPolicy', () {
    test('target registry contains Liberty mixed POI layers', () {
      expect(
        QalaGoMapCommercialPoiPolicy.libertyMixedPoiLayerIds,
        ['poi_r1', 'poi_r7', 'poi_r20'],
      );
    });

    test('protected layers exclude mixed POI ids', () {
      for (final id in QalaGoMapCommercialPoiPolicy.libertyMixedPoiLayerIds) {
        expect(
          QalaGoMapCommercialPoiPolicy.protectedLayerIds,
          isNot(contains(id)),
        );
      }
    });

    test('public civic classes are not in commercial denylist', () {
      const civic = [
        'hospital',
        'school',
        'college',
        'library',
        'town_hall',
        'cemetery',
        'attraction',
        'stadium',
        'fuel',
        'post',
        'bus',
        'railway',
        'art_gallery',
      ];
      for (final c in civic) {
        expect(
          QalaGoMapCommercialPoiPolicy.commercialPoiClasses,
          isNot(contains(c)),
        );
      }
    });

    test('merge preserves base filter and adds commercial suppression', () {
      final base = QalaGoMapCommercialPoiPolicy.libertyBaseFilters['poi_r1']!;
      final merged =
          QalaGoMapCommercialPoiPolicy.mergeFilterWithCommercialSuppression(
        base,
      );
      expect(merged.first, 'all');
      expect(merged.length, 3);
      final notClause = merged[2] as List;
      expect(notClause.first, '!');
      final match = (notClause[1] as List).first;
      expect(match, 'any');
    });

    test('commercial match uses class and subclass', () {
      final expr = QalaGoMapCommercialPoiPolicy.commercialMatchExpression();
      expect(expr.first, 'any');
      final json = expr.toString();
      expect(json, contains('class'));
      expect(json, contains('subclass'));
      expect(json, contains('restaurant'));
      expect(json, contains('shop'));
    });

    test('is city-agnostic', () {
      expect(QalaGoMapCommercialPoiPolicy.isCityAgnostic, isTrue);
      final policySource = File(
        'lib/core/map/qalago_map_commercial_poi_policy.dart',
      ).readAsStringSync();
      final hardeningSource = File(
        'lib/core/map/qalago_map_basemap_hardening.dart',
      ).readAsStringSync();
      for (final slug in ['uralsk', 'aktobe', 'almaty', 'citySlug', 'cityId']) {
        expect(policySource.toLowerCase(), isNot(contains(slug)));
        expect(hardeningSource.toLowerCase(), isNot(contains(slug)));
      }
    });

    test('office class is not blanket-denied (civic offices preserved)', () {
      expect(
        QalaGoMapCommercialPoiPolicy.commercialPoiClasses,
        isNot(contains('office')),
      );
    });

    test('house-number layers are not targeted', () {
      for (final id in QalaGoMapCommercialPoiPolicy.libertyMixedPoiLayerIds) {
        expect(id.contains('house'), isFalse);
        expect(id.contains('housenumber'), isFalse);
      }
    });
  });
}
