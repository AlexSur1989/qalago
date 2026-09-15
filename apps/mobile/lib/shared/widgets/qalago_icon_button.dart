import 'package:flutter/material.dart';

import '../../core/theme/qalago_icon_sizes.dart';
import '../../core/theme/qalago_touch_targets.dart';

/// Icon-only control with at least [QalaGoTouchTargets.minInteractive] hit area.
class QalaGoIconButton extends StatelessWidget {
  const QalaGoIconButton({
    super.key,
    required this.icon,
    required this.semanticsLabel,
    this.onPressed,
    this.iconSize = QalaGoIconSizes.standard,
    this.iconColor,
    this.tooltip,
    this.backgroundColor,
  });

  final IconData icon;
  final String semanticsLabel;
  final VoidCallback? onPressed;
  final double iconSize;
  final Color? iconColor;
  final String? tooltip;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = iconColor ?? scheme.onSurface;

    Widget child = Semantics(
      button: true,
      label: semanticsLabel,
      enabled: onPressed != null,
      child: Material(
        color: backgroundColor ?? Colors.transparent,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onPressed,
          child: SizedBox(
            width: QalaGoTouchTargets.minInteractive,
            height: QalaGoTouchTargets.minInteractive,
            child: Icon(icon, size: iconSize, color: color),
          ),
        ),
      ),
    );

    if (tooltip != null && tooltip!.isNotEmpty) {
      child = Tooltip(message: tooltip!, child: child);
    }

    return child;
  }
}
