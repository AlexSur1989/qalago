import '../../../shared/models/models.dart';

class HomeCategorySlice {
  const HomeCategorySlice({
    required this.preview,
    required this.showAllCategories,
  });

  /// Up to [homePrimaryCategoryCount] primary shortcuts on Home.
  final List<CategoryModel> preview;

  /// Separate «All categories» action (not a grid cell).
  final bool showAllCategories;
}

/// Eight primary category shortcuts; «All» is handled outside the grid.
const homePrimaryCategoryCount = 8;

HomeCategorySlice sliceHomeCategories(List<CategoryModel> all) {
  if (all.isEmpty) {
    return const HomeCategorySlice(preview: [], showAllCategories: false);
  }
  final preview = all.length <= homePrimaryCategoryCount
      ? all
      : all.take(homePrimaryCategoryCount).toList(growable: false);
  return HomeCategorySlice(preview: preview, showAllCategories: true);
}

int homeCategoryGridColumns(double width) {
  if (width >= 900) return 5;
  if (width >= 720) return 4;
  if (width >= 520) return 4;
  return 4;
}
