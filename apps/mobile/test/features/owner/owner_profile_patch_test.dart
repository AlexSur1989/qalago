import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_subcategory_edit.dart';

void main() {
  test('title-only profile patch never includes subcategoryIds', () {
    final payload = buildOwnerProfileFieldsPatch({
      'title': 'Only title',
      'description': 'Desc',
    });
    expect(payload.keys, containsAll(['title', 'description']));
    expect(payload.containsKey('subcategoryIds'), isFalse);
  });

  test('intentional clear sends empty subcategoryIds array', () {
    expect(buildSubcategoryIdsPatch([]), {'subcategoryIds': <String>[]});
  });
}
