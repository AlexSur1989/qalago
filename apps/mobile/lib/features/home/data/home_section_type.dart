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

  static List<HomeSectionType> parseOrderedList(
    Iterable<dynamic> rows, {
    void Function(String unknown)? onUnknown,
  }) {
    final out = <HomeSectionType>[];
    for (final row in rows) {
      if (row is! Map) continue;
      final typeRaw = row['type'] as String? ?? row['sectionType'] as String?;
      final enabled = row['enabled'];
      if (enabled == false) continue;
      final parsed = tryParse(typeRaw);
      if (parsed == null) {
        onUnknown?.call(typeRaw ?? '');
        continue;
      }
      out.add(parsed);
    }
    return out;
  }
}

/// Legacy mobile Home discovery order (pre-config authority). Used when API fails.
const kHomeDiscoverySectionFallback = <HomeSectionType>[
  HomeSectionType.categories,
  HomeSectionType.homeVipBanner,
  HomeSectionType.nearby,
  HomeSectionType.homeFeatured,
  HomeSectionType.homePromotions,
  HomeSectionType.homePopular,
];
