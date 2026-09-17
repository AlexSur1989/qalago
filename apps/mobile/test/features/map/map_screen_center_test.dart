import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/map/map_screen_center.dart';
void main() {
  const uralskCity = CityState(
    slug: 'uralsk',
    nameRu: 'Уральск',
    centerLat: 51.2278,
    centerLng: 51.3865,
  );

  test('uses city center when user is far from city', () {
    const user = UserPosition(latitude: 43.0, longitude: 76.0);
    final center = resolveMapScreenCenter(
      city: uralskCity,
      userPosition: user,
      businesses: const [],
    );
    expect(center.latitude, uralskCity.centerLat);
    expect(center.longitude, uralskCity.centerLng);
  });

  test('uses user position when within 25 km of city', () {
    const user = UserPosition(latitude: 51.23, longitude: 51.38);
    final center = resolveMapScreenCenter(
      city: uralskCity,
      userPosition: user,
      businesses: const [],
    );
    expect(center.latitude, user.latitude);
    expect(center.longitude, user.longitude);
  });
}
