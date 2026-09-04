import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/catalog/data/catalog_repository.dart';
import '../network/dio_provider.dart';
import 'city_provider.dart';

final _catalogRepositoryProvider = Provider(
  (ref) => CatalogRepository(ref.watch(dioProvider)),
);

/// Total active businesses in the selected city (lightweight: limit=1 + meta.total).
final cityCatalogTotalProvider = FutureProvider<int>((ref) async {
  final city = ref.watch(cityProvider);
  final page = await ref.watch(_catalogRepositoryProvider).fetchBusinesses(
        citySlug: city.slug,
        limit: 1,
      );
  return page.total;
});
