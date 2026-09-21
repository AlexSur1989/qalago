import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/map/map_physical_key.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  BusinessModel model({required String id, String? locationId}) =>
      BusinessModel(
        id: id,
        locationId: locationId,
        title: 'T',
        slug: 's',
        address: 'A',
        latitude: 51,
        longitude: 51,
      );

  test('physicalKey uses locationId when present', () {
    expect(mapPhysicalKey(model(id: 'b1', locationId: 'loc-2')), 'loc-2');
  });

  test('physicalKey falls back to business id', () {
    expect(mapPhysicalKey(model(id: 'b1')), 'b1');
  });

  test('fromJson parses optional locationId', () {
    final parsed = BusinessModel.fromJson({
      'id': 'b1',
      'locationId': 'loc-1',
      'title': 'T',
      'slug': 's',
      'address': 'A',
    });
    expect(parsed.locationId, 'loc-1');
    expect(parsed.id, 'b1');
  });
}
