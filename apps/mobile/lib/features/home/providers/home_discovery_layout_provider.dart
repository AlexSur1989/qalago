import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/deep_links/deep_link_session_city.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/home_section_type.dart';

/// Resolved discovery section order for the current city (APP platform).
final homeDiscoveryLayoutProvider = FutureProvider<List<HomeSectionType>>((ref) async {
  final citySlug = ref.watch(discoveryCitySlugProvider);
  final repo = ref.watch(catalogRepositoryProvider);
  try {
    final sections = await repo.fetchHomeDiscoverySections(citySlug: citySlug);
    if (sections.isEmpty) {
      return kHomeDiscoverySectionFallback;
    }
    return sections;
  } catch (_) {
    return kHomeDiscoverySectionFallback;
  }
});
