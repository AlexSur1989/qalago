import 'package:flutter/material.dart';

import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';

class SponsoredLabel extends StatelessWidget {
  const SponsoredLabel({
    super.key,
    this.label,
  });

  final String? label;

  @override
  Widget build(BuildContext context) {
    final text = label ?? context.l10n.commonAd;
    return Semantics(
      label: text,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.kzBlue,
            ),
          ),
        ),
      ),
    );
  }
}
