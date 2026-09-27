import '../../features/catalog/data/catalog_repository.dart';
import '../../shared/models/models.dart';

typedef CategorySlugResolution = ({
  String categoryId,
  String? subcategoryId,
});

CategoryModel? findCategoryBySlug(
  List<CategoryModel> categories,
  String categorySlug,
) {
  final normalized = categorySlug.trim().toLowerCase();
  for (final category in categories) {
    if (category.slug.toLowerCase() == normalized) return category;
  }
  return null;
}

SubcategoryModel? findSubcategoryBySlug(
  List<SubcategoryModel> subcategories,
  String subcategorySlug,
) {
  final normalized = subcategorySlug.trim().toLowerCase();
  for (final sub in subcategories) {
    if (sub.slug.toLowerCase() == normalized) return sub;
  }
  return null;
}

Future<CategorySlugResolution?> resolvePublicCategorySlugs({
  required CatalogRepository catalog,
  required String citySlug,
  required String categorySlug,
  String? subcategorySlug,
}) async {
  final categories = await catalog.fetchCategories(citySlug: citySlug);
  final category = findCategoryBySlug(categories, categorySlug);
  if (category == null) return null;

  if (subcategorySlug == null || subcategorySlug.trim().isEmpty) {
    return (categoryId: category.id, subcategoryId: null);
  }

  final subs = await catalog.fetchSubcategories(category.id);
  final sub = findSubcategoryBySlug(subs, subcategorySlug);
  if (sub == null) return null;
  return (categoryId: category.id, subcategoryId: sub.id);
}
