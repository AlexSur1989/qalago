import 'package:flutter/material.dart';

import '../../core/theme/qalago_spacing.dart';
import '../../core/theme/theme_extensions.dart';

/// Section title row — optional subtitle and trailing action.
class QalaGoSectionHeader extends StatelessWidget {
  const QalaGoSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.action,
    this.emphasis = false,
  });

  final String title;
  final String? subtitle;
  final Widget? action;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    final titleStyle =
        emphasis ? context.sectionTitleEmphasisStyle : context.sectionTitleStyle;

    return Semantics(
      header: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: titleStyle,
                  maxLines: 3,
                ),
              ),
              if (action != null) ...[
                const SizedBox(width: QalaGoSpacing.space8),
                action!,
              ],
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: QalaGoSpacing.space4),
            Text(
              subtitle!,
              style: context.bodySecondaryStyle,
              maxLines: 4,
            ),
          ],
        ],
      ),
    );
  }
}
