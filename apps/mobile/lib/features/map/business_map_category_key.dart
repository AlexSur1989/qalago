/// Stable visual bucket for native map styling (Stage 6.11C.6B).
///
/// Mirrors category heuristics used by map pin colors/icons; not a taxonomy change.
String businessMapCategoryKey(String? categoryTitle) {
  final normalized = categoryTitle?.toLowerCase() ?? '';
  if (normalized.contains('бар')) return 'bar';
  if (normalized.contains('фитнес')) return 'fitness';
  if (normalized.contains('крас')) return 'beauty';
  if (normalized.contains('магаз')) return 'retail';
  if (normalized.contains('мед')) return 'medical';
  if (normalized.contains('дет')) return 'kids';
  if (normalized.contains('авто')) return 'auto';
  return 'default';
}
