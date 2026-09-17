import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../l10n/app_localizations.dart';
import '../search_catalog_suggestions.dart';

class SearchRecentHistorySection extends StatelessWidget {
  const SearchRecentHistorySection({
    super.key,
    required this.queries,
    required this.l10n,
    required this.onSelect,
    required this.onClear,
  });

  final List<String> queries;
  final AppLocalizations l10n;
  final ValueChanged<String> onSelect;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    if (queries.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                l10n.searchRecentQueriesTitle,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
            TextButton(
              onPressed: onClear,
              child: Text(l10n.searchRecentQueriesClear),
            ),
          ],
        ),
        const SizedBox(height: QalaGoSpacing.space4),
        ...queries.map(
          (query) => _SearchHistoryRow(
            query: query,
            onTap: () => onSelect(query),
          ),
        ),
      ],
    );
  }
}

class _SearchHistoryRow extends StatelessWidget {
  const _SearchHistoryRow({
    required this.query,
    required this.onTap,
  });

  final String query;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: QalaGoTouchTargets.minInteractive),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: QalaGoSpacing.space4),
            child: Row(
              children: [
                const Icon(Icons.history, size: 20, color: AppTheme.textMuted),
                const SizedBox(width: QalaGoSpacing.space12),
                Expanded(
                  child: Text(
                    query,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class SearchCatalogSuggestionsList extends StatelessWidget {
  const SearchCatalogSuggestionsList({
    super.key,
    required this.suggestions,
    required this.l10n,
    required this.onSelect,
  });

  final List<SearchCatalogSuggestion> suggestions;
  final AppLocalizations l10n;
  final ValueChanged<SearchCatalogSuggestion> onSelect;

  String _typeLabel(SearchCatalogSuggestionType type) {
    switch (type) {
      case SearchCatalogSuggestionType.category:
        return l10n.searchSuggestionTypeCategory;
      case SearchCatalogSuggestionType.subcategory:
        return l10n.searchSuggestionTypeSubcategory;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (suggestions.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...suggestions.map(
          (suggestion) => Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => onSelect(suggestion),
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  minHeight: QalaGoTouchTargets.minInteractive,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: QalaGoSpacing.space4,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        suggestion.displayLabel,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      Text(
                        _typeLabel(suggestion.type),
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: QalaGoSpacing.space8),
      ],
    );
  }
}
