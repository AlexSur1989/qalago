/// Responsive column count for full category/subcategory directories (not Home shortcuts).
int categoryDirectoryGridColumns(double width) {
  if (width >= 900) return 5;
  if (width >= 720) return 4;
  return 3;
}
