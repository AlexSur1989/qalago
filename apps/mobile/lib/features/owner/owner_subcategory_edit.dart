/// Owner business profile subcategory selection (M2M) — PATCH isolation helpers.

List<String> parseAssignedSubcategoryIds(Map<String, dynamic> businessData) {
  final raw = businessData['subcategories'];
  if (raw is! List) return const [];
  final ids = <String>[];
  for (final item in raw) {
    if (item is Map) {
      final id = item['id'];
      if (id is String && id.isNotEmpty) ids.add(id);
    }
  }
  return ids;
}

String? resolveBusinessCategoryId(Map<String, dynamic> businessData) {
  final direct = businessData['categoryId'];
  if (direct is String && direct.isNotEmpty) return direct;
  final category = businessData['category'];
  if (category is Map) {
    final id = category['id'];
    if (id is String && id.isNotEmpty) return id;
  }
  return null;
}

List<String> toggleSubcategorySelection(List<String> current, String subcategoryId) {
  if (current.contains(subcategoryId)) {
    return current.where((id) => id != subcategoryId).toList(growable: false);
  }
  return [...current, subcategoryId];
}

/// Profile PATCH must omit [subcategoryIds] unless taxonomy was edited (backend preserves when undefined).
Map<String, dynamic> buildOwnerProfileFieldsPatch(Map<String, dynamic> profileFields) {
  final copy = Map<String, dynamic>.from(profileFields);
  copy.remove('subcategoryIds');
  return copy;
}

const _ownerBusinessIdentityKeys = {'title', 'shortDesc', 'description'};

/// Business identity only — no branch address, geo, hours, or contacts (BusinessLocation API).
Map<String, dynamic> buildOwnerBusinessIdentityPatch(Map<String, dynamic> fields) {
  final identity = <String, dynamic>{};
  for (final key in _ownerBusinessIdentityKeys) {
    if (fields.containsKey(key)) identity[key] = fields[key];
  }
  return buildOwnerProfileFieldsPatch(identity);
}

bool ownerBusinessIdentityPatchExcludesBranchFields(Map<String, dynamic> patch) {
  const forbidden = {
    'address',
    'latitude',
    'longitude',
    'locationSource',
    'workHours',
    'phone',
    'whatsapp',
    'instagram',
    'website',
  };
  return patch.keys.every((k) => !forbidden.contains(k));
}

Map<String, dynamic> buildSubcategoryIdsPatch(List<String> selectedIds) {
  return {'subcategoryIds': List<String>.from(selectedIds)};
}

bool listsEqualUnordered(List<String> a, List<String> b) {
  if (a.length != b.length) return false;
  final setA = a.toSet();
  if (setA.length != a.length) {
    return a.length == b.length && a.every(b.contains);
  }
  return setA.containsAll(b);
}
