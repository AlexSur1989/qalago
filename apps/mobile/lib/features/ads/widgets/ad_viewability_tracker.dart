import 'dart:async';

import 'package:flutter/material.dart';
import 'package:visibility_detector/visibility_detector.dart';

import '../services/ad_impression_controller.dart';

/// Fires [onQualifiedImpression] once when >=50% visible for 1 second.
class AdViewabilityTracker extends StatefulWidget {
  const AdViewabilityTracker({
    super.key,
    required this.child,
    required this.onQualifiedImpression,
    this.logic = const AdViewabilityLogic(),
  });

  final Widget child;
  final VoidCallback onQualifiedImpression;
  final AdViewabilityLogic logic;

  @override
  State<AdViewabilityTracker> createState() => _AdViewabilityTrackerState();
}

class _AdViewabilityTrackerState extends State<AdViewabilityTracker> {
  Timer? _timer;
  bool _fired = false;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _onVisibilityChanged(VisibilityInfo info) {
    if (_fired) return;

    if (widget.logic.shouldCancelTimer(info.visibleFraction)) {
      _timer?.cancel();
      _timer = null;
      return;
    }

    if (!widget.logic.shouldStartTimer(info.visibleFraction)) return;
    if (_timer != null) return;

    _timer = Timer(
      Duration(milliseconds: widget.logic.requiredVisibleDurationMs),
      () {
        if (!mounted || _fired) return;
        if (info.visibleFraction < widget.logic.visibleFractionThreshold) {
          return;
        }
        _fired = true;
        widget.onQualifiedImpression();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: widget.key ?? UniqueKey(),
      onVisibilityChanged: _onVisibilityChanged,
      child: widget.child,
    );
  }
}
