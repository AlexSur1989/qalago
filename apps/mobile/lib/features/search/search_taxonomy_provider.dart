import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/models/models.dart';
import '../auth/providers/auth_provider.dart';

/// Loads all subcategories once per city (not per keystroke).
final searchTaxonomySubcategoriesProvider =
    FutureProvider<List<SubcategoryModel>>((ref) async {
  final categories = await ref.watch(categoriesProvider.future);
  if (categories.isEmpty) return const [];

  final repo = ref.watch(catalogRepositoryProvider);
  final lists = await Future.wait(
    categories.map((category) => repo.fetchSubcategories(category.id)),
  );
  return lists.expand((list) => list).toList(growable: false);
});
