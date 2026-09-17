import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/map/map_coordinate_validity.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  group('isValidMapCoordinate', () {
    test('rejects null, NaN, out of range, and 0,0', () {
      expect(isValidMapCoordinate(null, 1), isFalse);
      expect(isValidMapCoordinate(1, null), isFalse);
      expect(isValidMapCoordinate(double.nan, 1), isFalse);
      expect(isValidMapCoordinate(91, 0), isFalse);
      expect(isValidMapCoordinate(0, 181), isFalse);
      expect(isValidMapCoordinate(0, 0), isFalse);
    });

    test('accepts in-range finite coordinates', () {
      expect(isValidMapCoordinate(51.23, 51.37), isTrue);
    });
  });

  group('businessesWithValidMapCoordinates', () {
    test('filters invalid businesses', () {
      final items = [
        BusinessModel(
          id: 'ok',
          title: 'Ok',
          slug: 'ok',
          address: 'a',
          latitude: 51,
          longitude: 51,
        ),
        BusinessModel(
          id: 'bad',
          title: 'Bad',
          slug: 'bad',
          address: 'a',
        ),
      ];
      final filtered = businessesWithValidMapCoordinates(items);
      expect(filtered.map((b) => b.id), ['ok']);
    });
  });
}
