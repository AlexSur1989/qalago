import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_provider.dart';
import 'package:qalago_mobile/core/map/qalago_map_renderer.dart';
import 'package:qalago_mobile/core/map/providers/flutter_map_qalago_map_controller.dart';
import 'package:qalago_mobile/core/map/providers/maplibre_qalago_map_controller.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('parseQalaGoMapRenderer', () {
    test('maplibre aliases', () {
      expect(parseQalaGoMapRenderer('maplibre'), QalaGoMapRenderer.mapLibre);
      expect(parseQalaGoMapRenderer('map_libre'), QalaGoMapRenderer.mapLibre);
    });

    test('flutter_map aliases', () {
      expect(parseQalaGoMapRenderer('flutter_map'), QalaGoMapRenderer.flutterMap);
      expect(parseQalaGoMapRenderer('fluttermap'), QalaGoMapRenderer.flutterMap);
    });

    test('invalid falls back to flutter_map', () {
      expect(parseQalaGoMapRenderer('unknown'), QalaGoMapRenderer.flutterMap);
    });
  });

  test('resolve uses flutter_map under widget test binding', () {
    expect(resolveQalaGoMapRenderer(), QalaGoMapRenderer.flutterMap);
  });

  test('createQalaGoMapController matches resolved renderer', () {
    final controller = createQalaGoMapController();
    addTearDown(controller.dispose);
    expect(controller, isA<FlutterMapQalaGoMapController>());
  });
}
