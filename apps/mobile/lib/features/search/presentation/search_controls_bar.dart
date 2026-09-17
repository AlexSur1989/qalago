import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../l10n/app_localizations.dart';
import '../search_catalog_sort.dart';

class SearchControlsBar extends StatelessWidget {
  const SearchControlsBar({
    super.key,
    required this.l10n,
    required this.activeFilterCount,
    required this.selectedSort,
    required this.nearbySortEnabled,
    required this.onOpenFilters,
    required this.onSortSelected,
  });

  final AppLocalizations l10n;
  final int activeFilterCount;
  final SearchCatalogSort selectedSort;
  final bool nearbySortEnabled;
  final VoidCallback onOpenFilters;
  final ValueChanged<SearchCatalogSort> onSortSelected;

  String get _filtersLabel {
    if (activeFilterCount <= 0) return l10n.searchFiltersTitle;
    return l10n.searchFiltersWithCount(activeFilterCount);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: OutlinedButton(
            onPressed: onOpenFilters,
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, QalaGoTouchTargets.minInteractive),
              alignment: Alignment.centerLeft,
            ),
            child: Text(
              _filtersLabel,
              overflow: TextOverflow.ellipsis,
              maxLines: 2,
              textAlign: TextAlign.start,
            ),
          ),
        ),
        const SizedBox(width: QalaGoSpacing.space8),
        Expanded(
          flex: 2,
          child: PopupMenuButton<SearchCatalogSort>(
            tooltip: l10n.searchSortMenuTooltip,
            initialValue: selectedSort,
            onSelected: onSortSelected,
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: QalaGoSpacing.space8,
                vertical: QalaGoSpacing.space8,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      selectedSort.localizedLabel(l10n),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 2,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down, color: AppTheme.textMuted),
                ],
              ),
            ),
            itemBuilder: (context) {
              return SearchCatalogSort.values.map((sort) {
                final enabled =
                    sort != SearchCatalogSort.nearest || nearbySortEnabled;
                return PopupMenuItem<SearchCatalogSort>(
                  key: Key('search_sort_${sort.apiValue}'),
                  value: sort,
                  enabled: enabled,
                  child: Text(sort.localizedLabel(l10n)),
                );
              }).toList();
            },
          ),
        ),
      ],
    );
  }
}
