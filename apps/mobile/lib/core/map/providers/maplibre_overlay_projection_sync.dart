import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';

/// Coalesces MapLibre overlay [toScreenLocationBatch] work during camera gestures.
///
/// Bridge fix until C.6 native symbol layers; not used for catalog/API fetches.
class MapLibreOverlayProjectionSync {
  int _generation = 0;
  bool _frameScheduled = false;
  bool _inFlight = false;
  bool _rerunAfterFlight = false;

  int get generation => _generation;

  /// Invalidates in-flight projection results (e.g. camera moved again).
  void bumpGeneration() => _generation++;

  bool isStale(int capturedGeneration) =>
      capturedGeneration != _generation;

  void dispose() {
    _generation++;
    _frameScheduled = false;
    _inFlight = false;
    _rerunAfterFlight = false;
  }

  /// At most one [onFrame] per Flutter frame while gestures coalesce events.
  void scheduleFrame(void Function() onFrame) {
    if (_frameScheduled) return;
    _frameScheduled = true;
    SchedulerBinding.instance.scheduleFrameCallback((_) {
      _frameScheduled = false;
      onFrame();
    });
  }

  /// Returns false if a batch is already running (caller should coalesce via [endProjection]).
  bool beginProjection() {
    if (_inFlight) {
      _rerunAfterFlight = true;
      return false;
    }
    _inFlight = true;
    return true;
  }

  void endProjection(void Function() scheduleAgain) {
    _inFlight = false;
    if (_rerunAfterFlight) {
      _rerunAfterFlight = false;
      scheduleAgain();
    }
  }

  bool get isProjectionInFlight => _inFlight;

  bool get hasPendingRerun => _rerunAfterFlight;

  @visibleForTesting
  bool get isFrameScheduled => _frameScheduled;
}
