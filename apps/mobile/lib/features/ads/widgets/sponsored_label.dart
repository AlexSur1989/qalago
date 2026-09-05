import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class SponsoredLabel extends StatelessWidget {
  const SponsoredLabel({
    super.key,
    this.label = 'Реклама',
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Text(
            label,
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
