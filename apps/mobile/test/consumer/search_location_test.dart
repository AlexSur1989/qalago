import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';

void main() {
  test('whole city search query omits geo radius', () {
    const query = BusinessesQuery(search: 'кофе', categoryId: 'cat1');
    expect(query.latitude, isNull);
    expect(query.longitude, isNull);
    expect(query.radiusKm, isNull);
  });

  test('radius search query includes geo params', () {
    const query = BusinessesQuery(
      search: 'кофе',
      latitude: 51.23,
      longitude: 51.38,
      radiusKm: 5,
    );
    expect(query.radiusKm, 5);
    expect(query.latitude, 51.23);
  });

  test('location denied falls back to city center for search geo', () {
    final container = ProviderContainer(
      overrides: [
        cityProvider.overrideWith(
          () => _CityWithCenter(),
        ),
        userLocationProvider.overrideWith(
          (ref) => Stream<UserPosition?>.value(null),
        ),
      ],
    );
    addTearDown(container.dispose);

    final position = container.read(nearbySearchPositionProvider);
    expect(position.latitude, 51.2278);
    expect(position.longitude, 51.3865);
  });
}

class _CityWithCenter extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        launchStatus: 'LIVE',
        centerLat: 51.2278,
        centerLng: 51.3865,
      );
}
