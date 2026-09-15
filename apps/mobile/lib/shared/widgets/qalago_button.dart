import 'package:flutter/material.dart';

import '../../core/theme/qalago_touch_targets.dart';
import '../../core/theme/theme_extensions.dart';

enum QalaGoButtonVariant { primary, secondary, tertiary, destructive }

/// Canonical QalaGo action button — thin wrapper over Material buttons.
class QalaGoButton extends StatelessWidget {
  const QalaGoButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = QalaGoButtonVariant.primary,
    this.loading = false,
    this.leading,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final QalaGoButtonVariant variant;
  final bool loading;
  final Widget? leading;
  final bool expand;

  bool get _enabled => onPressed != null && !loading;

  @override
  Widget build(BuildContext context) {
    final child = _buildChild(context);
    final button = switch (variant) {
      QalaGoButtonVariant.primary => FilledButton(
          onPressed: _enabled ? onPressed : null,
          style: _minHeightStyle(context, FilledButton.styleFrom()),
          child: child,
        ),
      QalaGoButtonVariant.secondary => OutlinedButton(
          onPressed: _enabled ? onPressed : null,
          style: _minHeightStyle(context, OutlinedButton.styleFrom()),
          child: child,
        ),
      QalaGoButtonVariant.tertiary => TextButton(
          onPressed: _enabled ? onPressed : null,
          style: _minHeightStyle(context, TextButton.styleFrom()),
          child: child,
        ),
      QalaGoButtonVariant.destructive => FilledButton(
          onPressed: _enabled ? onPressed : null,
          style: _minHeightStyle(
            context,
            FilledButton.styleFrom(
              backgroundColor: context.cs.error,
              foregroundColor: context.cs.onError,
              disabledBackgroundColor: context.cs.error.withValues(alpha: 0.38),
              disabledForegroundColor: context.cs.onError.withValues(alpha: 0.62),
            ),
          ),
          child: child,
        ),
    };

    if (!expand) return button;
    return SizedBox(width: double.infinity, child: button);
  }

  ButtonStyle _minHeightStyle(BuildContext context, ButtonStyle base) {
    return base.copyWith(
      minimumSize: WidgetStateProperty.all(
        const Size(64, QalaGoTouchTargets.minInteractive),
      ),
      textStyle: WidgetStateProperty.all(context.buttonLabelStyle),
    );
  }

  Widget _buildChild(BuildContext context) {
    if (loading) {
      return Semantics(
        label: label,
        value: 'Loading',
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: variant == QalaGoButtonVariant.secondary ||
                        variant == QalaGoButtonVariant.tertiary
                    ? context.cs.primary
                    : variant == QalaGoButtonVariant.destructive
                        ? context.cs.onError
                        : context.cs.onPrimary,
              ),
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(label, maxLines: 3, textAlign: TextAlign.center),
            ),
          ],
        ),
      );
    }

    if (leading == null) {
      return Text(label, maxLines: 3, textAlign: TextAlign.center);
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        leading!,
        const SizedBox(width: 8),
        Flexible(
          child: Text(label, maxLines: 3, textAlign: TextAlign.center),
        ),
      ],
    );
  }
}
