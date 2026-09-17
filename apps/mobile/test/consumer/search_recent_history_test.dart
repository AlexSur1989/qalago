import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/search/search_query_normalize.dart';
import 'package:qalago_mobile/features/search/search_recent_history_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  group('normalizeConsumerSearchQuery', () {
    test('trims and collapses whitespace', () {
      expect(normalizeConsumerSearchQuery('  маникюр   studio '), 'маникюр studio');
    });

    test('empty returns null', () {
      expect(normalizeConsumerSearchQuery('   '), isNull);
    });
  });

  group('shouldPersistConsumerSearchHistory', () {
    test('requires min length without category', () {
      expect(
        shouldPersistConsumerSearchHistory(trimmedQuery: 'м', categoryId: null),
        isFalse,
      );
      expect(
        shouldPersistConsumerSearchHistory(trimmedQuery: 'ма', categoryId: null),
        isTrue,
      );
    });

    test('allows short query with category filter', () {
      expect(
        shouldPersistConsumerSearchHistory(trimmedQuery: 'a', categoryId: 'cat1'),
        isTrue,
      );
    });
  });

  group('SearchRecentHistoryNotifier', () {
    test('push dedupes and moves to top', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(searchRecentHistoryProvider.notifier);
      await notifier.future;
      await notifier.push('маникюр');
      await notifier.push('кафе');
      await notifier.push('маникюр');

      final list = container.read(searchRecentHistoryProvider).value!;
      expect(list, ['маникюр', 'кафе']);
    });

    test('max 10 unique entries', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(searchRecentHistoryProvider.notifier);
      await notifier.future;
      for (var i = 0; i < 12; i++) {
        await notifier.push('q$i');
      }
      final list = container.read(searchRecentHistoryProvider).value!;
      expect(list.length, kSearchRecentHistoryMaxItems);
      expect(list.first, 'q11');
    });

    test('clear removes all', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(searchRecentHistoryProvider.notifier);
      await notifier.future;
      await notifier.push('маникюр');
      await notifier.clear();
      expect(container.read(searchRecentHistoryProvider).value, isEmpty);
    });

    test('persists in SharedPreferences', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(searchRecentHistoryProvider.notifier).push('ресторан');
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getStringList(kSearchRecentHistoryPrefsKey), ['ресторан']);
    });
  });
}
