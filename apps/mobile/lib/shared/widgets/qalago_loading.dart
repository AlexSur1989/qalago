import 'package:flutter/material.dart';

import '../../core/theme/qalago_spacing.dart';

/// Inline or centered progress indicator with accessible label.
class QalaGoLoadingIndicator extends StatelessWidget {
  const QalaGoLoadingIndicator({
    super.key,
    this.inline = false,
    this.semanticsLabel,
  });

  final bool inline;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    final progress = const CircularProgressIndicator();
    final indicator = semanticsLabel != null
        ? Semantics(
            label: semanticsLabel,
            liveRegion: true,
            child: progress,
          )
        : progress;

    if (inline) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: QalaGoSpacing.space8),
        child: Center(child: indicator),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(QalaGoSpacing.space24),
      child: Center(child: indicator),
    );
  }
}
