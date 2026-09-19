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

  test('C.6C uses unclustered source mode', () {
    expect(QalaGoMapBusinessClusterConfig.enabledOnSource, isFalse);
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
