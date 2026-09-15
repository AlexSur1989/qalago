/// Owner menu pagination helpers (Stage 5G.1).
library;

import '../../l10n/app_localizations.dart';

bool ownerMenuHasMore(Map<String, dynamic>? pagination) {
  if (pagination == null) return false;
  final page = pagination['page'] as int? ?? 1;
  final totalPages = pagination['totalPages'] as int? ?? 0;
  return page < totalPages;
}

List<Map<String, dynamic>> mergeOwnerMenuItems(
  List<Map<String, dynamic>> existing,
  List<Map<String, dynamic>> incoming,
) {
  final seen = existing.map((e) => e['id'] as String).toSet();
  final merged = [...existing];
  for (final item in incoming) {
    final id = item['id'] as String?;
    if (id == null || seen.contains(id)) continue;
    seen.add(id);
    merged.add(item);
  }
  return merged;
}

String? ownerMenuEmptyMessage(
  AppLocalizations l10n, {
  required int totalCount,
  required String? search,
  required String? sectionId,
}) {
  if (totalCount > 0) return null;
  if (search != null && search.trim().isNotEmpty) {
    return l10n.catalogNotFound;
  }
  if (sectionId != null && sectionId.isNotEmpty) {
    return l10n.ownerMenuEmpty;
  }
  return l10n.ownerMenuEmpty;
}

String? itemSectionId(Map<String, dynamic> item) {
  return item['sectionId'] as String? ?? item['groupId'] as String?;
}

String itemSectionLabel(AppLocalizations l10n, Map<String, dynamic> item) {
  final section = item['section'];
  if (section is Map) {
    return section['title'] as String? ?? l10n.ownerMenuNoGroup;
  }
  return itemSectionId(item) == null ? l10n.ownerMenuNoGroup : l10n.ownerMenuNoSection;
}
