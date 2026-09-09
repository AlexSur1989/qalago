import 'dart:async';

import 'package:flutter/material.dart';
import 'package:visibility_detector/visibility_detector.dart';

import '../services/analytics_impression_controller.dart';

/// Fires [onQualifiedVisible] once when >=50% visible for 500ms.
class OrganicViewabilityTracker extends StatefulWidget {
  const OrganicViewabilityTracker({
    super.key,
    required this.trackingKey,
    required this.child,
    required this.onQualifiedVisible,
    this.logic = const OrganicViewabilityLogic(),
  });

  final Key trackingKey;
  final Widget child;
  final VoidCallback onQualifiedVisible;
  final OrganicViewabilityLogic logic;

  @override
  State<OrganicViewabilityTracker> createState() =>
      _OrganicViewabilityTrackerState();
}

class _OrganicViewabilityTrackerState extends State<OrganicViewabilityTracker> {
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
        widget.onQualifiedVisible();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: widget.trackingKey,
      onVisibilityChanged: _onVisibilityChanged,
      child: widget.child,
    );
  }
}
