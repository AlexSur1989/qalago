import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'search_query_normalize.dart';

const int kSearchRecentHistoryMaxItems = 10;
const String kSearchRecentHistoryPrefsKey = 'qalago_search_recent_queries_v1';

/// Recent committed search strings (local device only).
class SearchRecentHistoryNotifier extends AsyncNotifier<List<String>> {
  @override
  Future<List<String>> build() async {
    final prefs = await SharedPreferences.getInstance();
    return List<String>.from(prefs.getStringList(kSearchRecentHistoryPrefsKey) ?? const []);
  }

  Future<void> push(String rawQuery) async {
    final normalized = normalizeConsumerSearchQuery(rawQuery);
    if (normalized == null) return;

    final current = List<String>.from(state.valueOrNull ?? await future);
    final next = [
      normalized,
      ...current.where((entry) => entry != normalized),
    ].take(kSearchRecentHistoryMaxItems).toList();

    state = AsyncData(next);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(kSearchRecentHistoryPrefsKey, next);
  }

  Future<void> clear() async {
    state = const AsyncData([]);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(kSearchRecentHistoryPrefsKey);
  }
}

final searchRecentHistoryProvider =
    AsyncNotifierProvider<SearchRecentHistoryNotifier, List<String>>(
  SearchRecentHistoryNotifier.new,
);
