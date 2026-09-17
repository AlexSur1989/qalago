import '../../shared/models/models.dart';
import 'search_query_normalize.dart';

const int kSearchCatalogSuggestionLimit = 8;

enum SearchCatalogSuggestionType { category, subcategory }

enum SearchSuggestionMatchTier {
  exact(0),
  prefix(1),
  contains(2);

  const SearchSuggestionMatchTier(this.rank);
  final int rank;
}

class SearchCatalogSuggestion {
  const SearchCatalogSuggestion({
    required this.id,
    required this.commitText,
    required this.displayLabel,
    required this.type,
    required this.tier,
  });

  final String id;
  final String commitText;
  final String displayLabel;
  final SearchCatalogSuggestionType type;
  final SearchSuggestionMatchTier tier;
}

SearchSuggestionMatchTier? _bestTierForNeedle(String needle, String field) {
  if (field.isEmpty) return null;
  final haystack = field.toLowerCase();
  if (haystack == needle) return SearchSuggestionMatchTier.exact;
  if (haystack.startsWith(needle)) return SearchSuggestionMatchTier.prefix;
  if (haystack.contains(needle)) return SearchSuggestionMatchTier.contains;
  return null;
}

SearchSuggestionMatchTier? _bestTierAmongFields(String needle, Iterable<String> fields) {
  SearchSuggestionMatchTier? best;
  for (final field in fields) {
    final tier = _bestTierForNeedle(needle, field);
    if (tier == null) continue;
    if (best == null || tier.rank < best.rank) {
      best = tier;
    }
  }
  return best;
}

int _compareSuggestions(SearchCatalogSuggestion a, SearchCatalogSuggestion b) {
  final byTier = a.tier.rank.compareTo(b.tier.rank);
  if (byTier != 0) return byTier;
  final byLabel = a.displayLabel.toLowerCase().compareTo(
        b.displayLabel.toLowerCase(),
      );
  if (byLabel != 0) return byLabel;
  return a.id.compareTo(b.id);
}

List<SearchCatalogSuggestion> buildSearchCatalogSuggestions({
  required String rawQuery,
  required List<CategoryModel> categories,
  required List<SubcategoryModel> subcategories,
  required String localeCode,
}) {
  final normalized = normalizeConsumerSearchQuery(rawQuery);
  if (normalized == null) return const [];

  final needle = consumerSearchNeedle(normalized);
  if (needle.isEmpty) return const [];

  final suggestions = <SearchCatalogSuggestion>[];

  for (final category in categories) {
    final tier = _bestTierAmongFields(needle, [
      category.title,
      category.nameRu,
      category.nameKk,
      category.slug,
    ]);
    if (tier == null) continue;
    final label = category.displayName(localeCode: localeCode);
    suggestions.add(
      SearchCatalogSuggestion(
        id: 'cat:${category.id}',
        commitText: label,
        displayLabel: label,
        type: SearchCatalogSuggestionType.category,
        tier: tier,
      ),
    );
  }

  for (final sub in subcategories) {
    final tier = _bestTierAmongFields(needle, [
      sub.nameRu,
      sub.nameKk,
      sub.slug,
    ]);
    if (tier == null) continue;
    final label = sub.displayName(localeCode: localeCode);
    suggestions.add(
      SearchCatalogSuggestion(
        id: 'sub:${sub.id}',
        commitText: label,
        displayLabel: label,
        type: SearchCatalogSuggestionType.subcategory,
        tier: tier,
      ),
    );
  }

  suggestions.sort(_compareSuggestions);
  if (suggestions.length <= kSearchCatalogSuggestionLimit) {
    return suggestions;
  }
  return suggestions.sublist(0, kSearchCatalogSuggestionLimit);
}
