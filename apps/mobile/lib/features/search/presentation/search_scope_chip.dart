import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../l10n/app_localizations.dart';

/// Active category scope from deep link or chip selection.
class SearchScopeChip extends StatelessWidget {
  const SearchScopeChip({
    super.key,
    required this.label,
    required this.onClear,
    required this.l10n,
  });

  final String label;
  final VoidCallback onClear;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            minHeight: QalaGoTouchTargets.minInteractive,
          ),
          child: InputChip(
            label: Text(label),
            deleteIcon: const Icon(Icons.close_rounded, size: 18),
            onDeleted: onClear,
            deleteButtonTooltipMessage: l10n.searchScopeClearSemantics,
            selected: true,
            showCheckmark: false,
            selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
            labelStyle: const TextStyle(fontWeight: FontWeight.w600),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            visualDensity: VisualDensity.compact,
          ),
        ),
      ),
    );
  }
}
