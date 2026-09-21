import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/utils/business_detail_utils.dart';

void main() {
  test('route URL uses selected branch coordinates not primary-only semantics', () {
    final branch = BusinessModel(
      id: 'b1',
      locationId: 'loc-2',
      title: 'Brand',
      slug: 'brand',
      address: 'Branch B street',
      latitude: 51.555,
      longitude: 51.666,
    );

    final url = buildRouteUrl(
      latitude: branch.latitude,
      longitude: branch.longitude,
      address: branch.address,
    );

    expect(url, contains('51.555'));
    expect(url, contains('51.666'));
    expect(url, isNot(contains('51.2278')));
  });

  test('business detail identity remains parent business id', () {
    final branch = BusinessModel(
      id: 'b1',
      locationId: 'loc-2',
      title: 'Brand',
      slug: 'brand',
      address: 'Branch',
      latitude: 51.2,
      longitude: 51.3,
    );
    expect(branch.id, 'b1');
    expect(branch.locationId, 'loc-2');
  });
}
