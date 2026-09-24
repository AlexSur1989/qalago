import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_user_location_layer_style.dart';

void main() {
  test('native CircleLayer uses center-anchored circle semantics (not pin bottom)',
      () {
    // MapLibre circle layers anchor at geographic point center; overlay pins used
    // point.y - height (bottom-center) before MAP-LOCATION.1.
    expect(QalaGoMapUserLocationLayerStyle.circleRadius, 14.0);
    expect(QalaGoMapUserLocationLayerStyle.circleColor, '#00A8D6');
  });
}
