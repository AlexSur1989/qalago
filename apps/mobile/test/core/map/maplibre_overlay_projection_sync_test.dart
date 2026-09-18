import 'package:flutter/scheduler.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/providers/maplibre_overlay_projection_sync.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('MapLibreOverlayProjectionSync', () {
    test('bumpGeneration marks older captures stale', () {
      final sync = MapLibreOverlayProjectionSync();
      final before = sync.generation;
      sync.bumpGeneration();
      expect(sync.isStale(before), isTrue);
      expect(sync.isStale(sync.generation), isFalse);
    });

    test('dispose invalidates generation', () {
      final sync = MapLibreOverlayProjectionSync();
      final gen = sync.generation;
      sync.dispose();
      expect(sync.isStale(gen), isTrue);
    });

    test('beginProjection coalesces concurrent runs', () {
      final sync = MapLibreOverlayProjectionSync();
      expect(sync.beginProjection(), isTrue);
      expect(sync.beginProjection(), isFalse);
      expect(sync.hasPendingRerun, isTrue);
      sync.endProjection(() {});
      expect(sync.isProjectionInFlight, isFalse);
    });

    test('scheduleFrame coalesces to one callback per frame', () {
      final sync = MapLibreOverlayProjectionSync();
      var calls = 0;
      sync.scheduleFrame(() => calls++);
      sync.scheduleFrame(() => calls++);
      expect(sync.isFrameScheduled, isTrue);
      SchedulerBinding.instance.handleBeginFrame(Duration.zero);
      SchedulerBinding.instance.handleDrawFrame();
      expect(calls, 1);
    });
  });
}
