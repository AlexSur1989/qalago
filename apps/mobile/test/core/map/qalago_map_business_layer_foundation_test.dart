import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_cluster_config.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_ids.dart';
import 'package:qalago_mobile/core/map/qalago_native_map_business_layer_config.dart';
import 'package:qalago_mobile/core/map/providers/qalago_map_business_layer_controller.dart';

void main() {
  test('native business layer flag defaults to false', () {
    expect(QalaGoNativeMapBusinessLayerConfig.enabled, isFalse);
  });

  test('source and layer ids are stable', () {
    expect(QalaGoMapBusinessLayerIds.source, 'qalago-businesses');
    expect(QalaGoMapBusinessLayerIds.unclustered, 'qalago-business-unclustered');
    expect(QalaGoMapBusinessLayerIds.clusterCircles, 'qalago-business-clusters');
  });

  test('cluster tuning defaults are centralized', () {
    expect(QalaGoMapBusinessClusterConfig.enabledOnSource, isTrue);
    expect(QalaGoMapBusinessClusterConfig.clusterRadius, 55.0);
    expect(QalaGoMapBusinessClusterConfig.clusterMaxZoom, 14.0);
    expect(QalaGoMapBusinessClusterConfig.clusterMinPoints, 2.0);
  });

  test('empty feature collection helper is valid GeoJSON shell', () {
    final fc = QalaGoMapBusinessLayerController.emptyFeatureCollection();
    expect(fc['type'], 'FeatureCollection');
    expect(fc['features'], isEmpty);
  });
}
