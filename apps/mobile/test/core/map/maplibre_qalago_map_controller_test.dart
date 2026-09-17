import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/providers/maplibre_qalago_map_controller.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';

void main() {
  test('move before attach stores zoom for later', () {
    final controller = MapLibreQalaGoMapController();
    addTearDown(controller.dispose);

    controller.move(
      const QalaGoMapCoordinate(latitude: 51.23, longitude: 51.38),
      14,
    );
    expect(controller.zoom, 14);
    expect(controller.delegate, isNull);
  });
}
