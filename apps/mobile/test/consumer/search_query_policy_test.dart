import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/search/search_filters.dart';
import 'package:qalago_mobile/features/search/search_query_policy.dart';

void main() {
  test('initial pane for empty query', () {
    expect(
      resolveSearchResultsPaneMode(
        trimmedQuery: '',
        categoryId: null,
        radiusMode: SearchRadiusMode.wholeCity,
      ),
      SearchResultsPaneMode.initial,
    );
  });

  test('continue typing for single character', () {
    expect(
      resolveSearchResultsPaneMode(
        trimmedQuery: 'м',
        categoryId: null,
        radiusMode: SearchRadiusMode.wholeCity,
      ),
      SearchResultsPaneMode.continueTyping,
    );
  });

  test('category-only discovery without text', () {
    expect(
      searchShouldFetchBusinesses(
        trimmedQuery: '',
        categoryId: 'cat1',
        radiusMode: SearchRadiusMode.wholeCity,
      ),
      isTrue,
    );
    expect(
      searchApiTextParam(trimmedQuery: '', categoryId: 'cat1'),
      isNull,
    );
  });
}
