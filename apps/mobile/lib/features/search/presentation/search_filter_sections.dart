import 'package:flutter/material.dart';

import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/models/models.dart';
import '../../categories/utils/category_display.dart';
import '../search_filters.dart';

class SearchCategoryFilterWrap extends StatelessWidget {
  const SearchCategoryFilterWrap({
    super.key,
    required this.categories,
    required this.selectedId,
    required this.localeCode,
    required this.onSelected,
  });

  final List<CategoryModel> categories;
  final String? selectedId;
  final String localeCode;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: [
        FilterChip(
          label: Text(context.l10n.commonAllCategories),
          selected: selectedId == null,
          onSelected: (_) => onSelected(null),
          selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
          checkmarkColor: AppTheme.kzBlue,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          visualDensity: VisualDensity.compact,
          padding: const EdgeInsets.symmetric(horizontal: 4),
        ),
        for (final category in categories)
          FilterChip(
            label: Text(categoryDisplayName(category, localeCode: localeCode)),
            selected: selectedId == category.id,
            onSelected: (_) => onSelected(category.id),
            selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
            checkmarkColor: AppTheme.kzBlue,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.symmetric(horizontal: 4),
          ),
      ],
    );
  }
}

class SearchRadiusFilterWrap extends StatelessWidget {
  const SearchRadiusFilterWrap({
    super.key,
    required this.selected,
    required this.l10n,
    required this.onSelected,
  });

  final SearchRadiusMode selected;
  final AppLocalizations l10n;
  final ValueChanged<SearchRadiusMode> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: [
        for (final mode in SearchRadiusMode.values)
          FilterChip(
            label: Text(mode.localizedLabel(l10n)),
            selected: selected == mode,
            onSelected: (_) => onSelected(mode),
            selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
            checkmarkColor: AppTheme.kzBlue,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.symmetric(horizontal: 4),
          ),
      ],
    );
  }
}

/// Minimum height for filter chip rows (accessibility).
const searchFilterMinTapHeight = QalaGoTouchTargets.minInteractive;
