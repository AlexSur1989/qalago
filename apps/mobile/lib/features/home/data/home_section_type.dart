/// Backend [HomeSectionType] values (`GET /home/sections`, CW.3 / WEB-HOME.3).
enum HomeSectionType {
  homeVipBanner('HOME_VIP_BANNER'),
  categories('CATEGORIES'),
  homeFeatured('HOME_FEATURED'),
  homePromotions('HOME_PROMOTIONS'),
  nearby('NEARBY'),
  homePopular('HOME_POPULAR');

  const HomeSectionType(this.apiValue);

  final String apiValue;

  static HomeSectionType? tryParse(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    for (final value in HomeSectionType.values) {
      if (value.apiValue == raw) return value;
    }
    return null;
  }

  /// Parses `/home/sections` rows: enabled known types, sort by position, dedupe.
  static List<HomeSectionType> parseAndNormalizeHomeSections(
    Iterable<dynamic> rows, {
    void Function(String unknown)? onUnknown,
  }) {
    final parsed = <({HomeSectionType type, int position})>[];
    for (final row in rows) {
      if (row is! Map) continue;
      final typeRaw = row['type'] as String? ?? row['sectionType'] as String?;
      final enabled = row['enabled'];
      if (enabled == false) continue;
      final sectionType = tryParse(typeRaw);
      if (sectionType == null) {
        if (typeRaw != null && typeRaw.isNotEmpty) {
          onUnknown?.call(typeRaw);
        }
        continue;
      }
      final position = (row['position'] as num?)?.toInt() ?? 0;
      parsed.add((type: sectionType, position: position));
    }
    parsed.sort((a, b) {
      final byPos = a.position.compareTo(b.position);
      if (byPos != 0) return byPos;
      return a.type.apiValue.compareTo(b.type.apiValue);
    });
    final seen = <HomeSectionType>{};
    final out = <HomeSectionType>[];
    for (final entry in parsed) {
      if (seen.contains(entry.type)) continue;
      seen.add(entry.type);
      out.add(entry.type);
    }
    return out;
  }

  @Deprecated('Use parseAndNormalizeHomeSections')
  static List<HomeSectionType> parseOrderedList(
    Iterable<dynamic> rows, {
    void Function(String unknown)? onUnknown,
  }) =>
      parseAndNormalizeHomeSections(rows, onUnknown: onUnknown);
}

/// Canonical global bootstrap order (matches Prisma CW.3 + HOME_POPULAR seed).
const kHomeDiscoverySectionFallback = <HomeSectionType>[
  HomeSectionType.homeVipBanner,
  HomeSectionType.categories,
  HomeSectionType.homeFeatured,
  HomeSectionType.homePromotions,
  HomeSectionType.nearby,
  HomeSectionType.homePopular,
];
