import 'package:flutter/material.dart';

import '../../core/locale/l10n_extension.dart';
import '../../core/theme/qalago_icon_sizes.dart';
import '../../core/theme/qalago_spacing.dart';
import '../../core/theme/theme_extensions.dart';

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final retryLabel = context.l10n.commonRetry;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(QalaGoSpacing.screenPaddingCompact),
        child: Semantics(
          container: true,
          label: message,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(QalaGoSpacing.space20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: QalaGoIconSizes.large,
                    color: scheme.error,
                  ),
                  const SizedBox(height: QalaGoSpacing.space12),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: context.bodyStyle,
                  ),
                  if (onRetry != null) ...[
                    const SizedBox(height: QalaGoSpacing.space16),
                    Semantics(
                      button: true,
                      label: retryLabel,
                      child: FilledButton.tonal(
                        onPressed: onRetry,
                        child: Text(retryLabel),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
