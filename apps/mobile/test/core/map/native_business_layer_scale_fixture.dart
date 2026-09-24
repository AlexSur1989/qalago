import 'package:qalago_mobile/features/map/business_map_geo_json_builder.dart';
import 'package:qalago_mobile/features/map/native_business_map_geo_json_payload.dart';
import 'package:qalago_mobile/shared/models/models.dart';

/// Deterministic BusinessLocation-grain datasets for MAP-PERF.C3.3 load QA.
abstract final class NativeBusinessLayerScaleFixture {
  static const scaleCounts = [100, 500, 1000, 3000];

  /// Five parent businesses × three branches each (15 features), remainder singles.
  static const multiBranchParents = 5;
  static const branchesPerParent = 3;

  static List<BusinessModel> businessLocations(int featureCount) {
    if (featureCount < 1) {
      throw ArgumentError.value(featureCount, 'featureCount', 'must be >= 1');
    }
    final rows = <BusinessModel>[];
    for (var p = 0; p < multiBranchParents; p++) {
      for (var b = 0; b < branchesPerParent; b++) {
        if (rows.length >= featureCount) {
          break;
        }
        final idx = rows.length;
        rows.add(_row(
          businessId: 'parent-$p',
          locationId: 'loc-parent-$p-branch-$b',
          index: idx,
          categoryId: 'cat-multi',
          categoryTitle: 'Food',
        ));
      }
    }
    while (rows.length < featureCount) {
      final idx = rows.length;
      rows.add(_row(
        businessId: 'biz-$idx',
        locationId: 'loc-$idx',
        index: idx,
        categoryId: 'cat-${idx % 7}',
        categoryTitle: idx.isEven ? 'Cafe' : 'Shop',
      ));
    }
    return rows;
  }

  static BusinessModel _row({
    required String businessId,
    required String locationId,
    required int index,
    required String categoryId,
    required String categoryTitle,
  }) {
    final lat = 51.200000 + index * 0.000013;
    final lng = 51.380000 + index * 0.000017;
    return BusinessModel(
      id: businessId,
      locationId: locationId,
      title: 'Title-$locationId',
      slug: 'slug-$locationId',
      address: 'Addr-$index',
      latitude: lat,
      longitude: lng,
      categoryId: categoryId,
      categoryTitle: categoryTitle,
    );
  }

  static NativeBusinessMapGeoJsonPayload buildPayload(int featureCount) {
    return BusinessMapGeoJsonBuilder.buildPayload(
      businesses: businessLocations(featureCount),
    );
  }

  static Map<String, dynamic> cloneFeatureCollection(Map<String, dynamic> source) {
    return Map<String, dynamic>.from(source)
      ..['features'] = (source['features'] as List)
          .map((f) => Map<String, dynamic>.from(f as Map))
          .toList();
  }

  /// First single-branch [locationId] after multi-branch block.
  static String selectionLocationA(int featureCount) {
    final multiCount = multiBranchParents * branchesPerParent;
    if (featureCount <= multiCount) {
      return 'loc-parent-0-branch-0';
    }
    return 'loc-$multiCount';
  }

  static String selectionLocationB(int featureCount) => 'loc-parent-1-branch-1';

  static String selectionLocationC(int featureCount) {
    final multiCount = multiBranchParents * branchesPerParent;
    if (featureCount > multiCount + 2) {
      return 'loc-${multiCount + 2}';
    }
    return 'loc-parent-2-branch-2';
  }

  static int countUniqueLocationIds(Map<String, dynamic> featureCollection) {
    final features = featureCollection['features'] as List;
    final ids = <String>{};
    for (final f in features) {
      final props = (f as Map)['properties'] as Map?;
      if (props != null) {
        final id = props['locationId']?.toString();
        if (id != null) {
          ids.add(id);
        }
      }
    }
    return ids.length;
  }

  static int countFeaturesForBusinessId(
    Map<String, dynamic> featureCollection,
    String businessId,
  ) {
    final features = featureCollection['features'] as List;
    var n = 0;
    for (final f in features) {
      final props = (f as Map)['properties'] as Map?;
      if (props?['businessId']?.toString() == businessId) {
        n++;
      }
    }
    return n;
  }
}
