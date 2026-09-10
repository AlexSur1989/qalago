import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.screen),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline, size: 40, color: scheme.error),
                const SizedBox(height: 12),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(color: scheme.onSurface),
                ),
                if (onRetry != null) ...[
                  const SizedBox(height: 16),
                  FilledButton.tonal(onPressed: onRetry, child: const Text('Повторить')),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
