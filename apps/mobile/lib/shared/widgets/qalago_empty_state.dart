import 'package:flutter/material.dart';

import '../../core/theme/qalago_icon_sizes.dart';
import '../../core/theme/qalago_spacing.dart';
import '../../core/theme/theme_extensions.dart';
import 'qalago_button.dart';

/// Generic empty state — icon, title, optional body and CTA.
class QalaGoEmptyState extends StatelessWidget {
  const QalaGoEmptyState({
    super.key,
    this.icon = Icons.inbox_outlined,
    required this.title,
    this.description,
    this.actionLabel,
    this.onAction,
    this.actionVariant = QalaGoButtonVariant.primary,
  });

  final IconData icon;
  final String title;
  final String? description;
  final String? actionLabel;
  final VoidCallback? onAction;
  final QalaGoButtonVariant actionVariant;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Semantics(
      container: true,
      label: description == null ? title : '$title. $description',
      child: Padding(
        padding: const EdgeInsets.all(QalaGoSpacing.screenPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: QalaGoIconSizes.large, color: scheme.onSurfaceVariant),
            const SizedBox(height: QalaGoSpacing.space16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: context.sectionTitleStyle,
              maxLines: 4,
            ),
            if (description != null) ...[
              const SizedBox(height: QalaGoSpacing.space8),
              Text(
                description!,
                textAlign: TextAlign.center,
                style: context.bodySecondaryStyle,
                maxLines: 6,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: QalaGoSpacing.space20),
              QalaGoButton(
                label: actionLabel!,
                onPressed: onAction,
                variant: actionVariant,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
