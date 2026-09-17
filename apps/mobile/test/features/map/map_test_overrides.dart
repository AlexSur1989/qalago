import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/features/map/map_businesses_notifier.dart';
import 'package:qalago_mobile/shared/models/models.dart';

class TestMapBusinessesNotifier extends MapBusinessesNotifier {
  TestMapBusinessesNotifier(this.initialState);

  final MapBusinessesState initialState;

  @override
  MapBusinessesState build() => initialState;

  @override
  Future<void> onViewportIdle(QalaGoMapBounds bounds) async {}

  @override
  Future<void> retry() async {}
}

Override mapBusinessesForTest({
  required List<BusinessModel> items,
  int? catalogTotal,
  Object? error,
  bool loading = false,
}) {
  final state = mapBusinessesStateForTest(
    items: items,
    catalogTotal: catalogTotal,
    error: error,
    loading: loading,
  );
  return mapBusinessesNotifierProvider.overrideWith(
    () => TestMapBusinessesNotifier(state),
  );
}
