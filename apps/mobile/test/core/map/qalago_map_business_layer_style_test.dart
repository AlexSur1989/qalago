import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/business_map_category_colors.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_cluster_config.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_ids.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_style.dart';

void main() {
  test('source and layer ids are stable', () {
    expect(QalaGoMapBusinessLayerIds.source, 'qalago-businesses');
    expect(QalaGoMapBusinessLayerIds.unclustered, 'qalago-business-unclustered');
    expect(QalaGoMapBusinessLayerIds.selected, 'qalago-business-selected');
  });

  test('C.6D enables clustered source mode', () {
    expect(QalaGoMapBusinessClusterConfig.enabledOnSource, isTrue);
    expect(QalaGoMapBusinessClusterConfig.clusterRadius, 55.0);
    expect(QalaGoMapBusinessClusterConfig.clusterMaxZoom, 14.0);
    expect(QalaGoMapBusinessClusterConfig.clusterMinPoints, 2.0);
  });

  test('cluster filter uses point_count', () {
    final filter = QalaGoMapBusinessLayerStyle.clusterFeatureFilter();
    expect(filter, ['has', 'point_count']);
  });

  test('FIX1 cluster count uses point_count and Noto font', () {
    expect(
      QalaGoMapBusinessLayerStyle.fix1ClusterCountTextField(),
      ['get', 'point_count'],
    );
    expect(
      QalaGoMapBusinessLayerStyle.fix1ClusterCountTextFont(),
      ['Noto Sans Regular'],
    );
    expect(QalaGoMapBusinessLayerStyle.fix1ClusterCircleRadius, 22.0);
  });

  test('normal filter excludes clusters and selected', () {
    final filter = QalaGoMapBusinessLayerStyle.normalBusinessFilter();
    expect(filter.first, 'all');
    expect(filter.toString(), contains('selected'));
    expect(filter.toString(), contains('point_count'));
  });

  test('selected filter targets selected=1', () {
    final filter = QalaGoMapBusinessLayerStyle.selectedBusinessFilter();
    expect(filter.toString(), contains('selected'));
  });

  test('category color expression includes fitness bucket', () {
    final expr = BusinessMapCategoryColors.circleColorExpression();
    expect(expr.first, 'match');
    expect(expr.toString(), contains('fitness'));
  });

  test('isBusinessLayerId accepts QalaGo layers only', () {
    expect(
      QalaGoMapBusinessLayerStyle.isBusinessLayerId(
        QalaGoMapBusinessLayerIds.unclustered,
      ),
      isTrue,
    );
    expect(QalaGoMapBusinessLayerStyle.isBusinessLayerId('poi_r1'), isFalse);
  });
}
