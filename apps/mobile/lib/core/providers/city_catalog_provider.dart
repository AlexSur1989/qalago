import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/catalog/data/catalog_repository.dart';
import '../network/dio_provider.dart';
import '../deep_links/deep_link_session_city.dart';

final _catalogRepositoryProvider = Provider(
  (ref) => CatalogRepository(ref.watch(dioProvider)),
);

/// Total active businesses in the selected city (lightweight: limit=1 + meta.total).
final cityCatalogTotalProvider = FutureProvider<int>((ref) async {
  final citySlug = ref.watch(discoveryCitySlugProvider);
  final page = await ref.watch(_catalogRepositoryProvider).fetchBusinesses(
        citySlug: citySlug,
        limit: 1,
      );
  return page.total;
});
