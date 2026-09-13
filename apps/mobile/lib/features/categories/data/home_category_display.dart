import '../../../shared/models/models.dart';

class HomeCategorySlice {
  const HomeCategorySlice({required this.preview, required this.showMore});

  final List<CategoryModel> preview;
  final bool showMore;
}

/// Two rows on home + optional «Ещё» (UI-only, not a DB category).
HomeCategorySlice sliceHomeCategories(List<CategoryModel> all, int columns) {
  if (columns < 2) columns = 2;
  final capacity = columns * 2;
  if (all.length <= capacity) {
    return HomeCategorySlice(preview: all, showMore: false);
  }
  final previewCount = capacity - 1;
  return HomeCategorySlice(
    preview: all.take(previewCount).toList(growable: false),
    showMore: true,
  );
}

int homeCategoryGridColumns(double width) {
  if (width >= 900) return 5;
  if (width >= 720) return 4;
  if (width >= 520) return 4;
  return 4;
}
