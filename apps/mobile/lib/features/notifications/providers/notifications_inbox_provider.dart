import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../catalog/data/catalog_repository.dart';
import '../data/notification_model.dart';

@immutable
class NotificationsInboxState {
  const NotificationsInboxState({
    this.items = const [],
    this.initialLoading = true,
    this.initialError,
    this.loadingMore = false,
    this.loadMoreError,
    this.page = 0,
    this.totalPages = 1,
  });

  final List<AppNotification> items;
  final bool initialLoading;
  final Object? initialError;
  final bool loadingMore;
  final Object? loadMoreError;
  final int page;
  final int totalPages;

  bool get hasMore => page > 0 && page < totalPages;
  bool get isEmptyLoaded =>
      !initialLoading && initialError == null && items.isEmpty;

  NotificationsInboxState copyWith({
    List<AppNotification>? items,
    bool? initialLoading,
    Object? initialError,
    bool clearInitialError = false,
    bool? loadingMore,
    Object? loadMoreError,
    bool clearLoadMoreError = false,
    int? page,
    int? totalPages,
  }) {
    return NotificationsInboxState(
      items: items ?? this.items,
      initialLoading: initialLoading ?? this.initialLoading,
      initialError: clearInitialError
          ? null
          : initialError ?? this.initialError,
      loadingMore: loadingMore ?? this.loadingMore,
      loadMoreError: clearLoadMoreError
          ? null
          : loadMoreError ?? this.loadMoreError,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
    );
  }
}

class NotificationsInboxNotifier extends Notifier<NotificationsInboxState> {
  static const _pageSize = 20;

  bool _initialInFlight = false;
  bool _moreInFlight = false;

  NotificationsRepository get _repo =>
      ref.read(notificationsRepositoryProvider);

  @override
  NotificationsInboxState build() {
    ref.listen<String?>(authProvider.select((a) => a.user?.id), (
      previous,
      next,
    ) {
      if (previous != next) {
        state = const NotificationsInboxState();
        scheduleMicrotask(loadInitial);
      }
    });
    scheduleMicrotask(loadInitial);
    return const NotificationsInboxState();
  }

  Future<void> loadInitial() async {
    if (_initialInFlight) return;
    if (!ref.read(authProvider).isAuthenticated) {
      state = const NotificationsInboxState(initialLoading: false);
      return;
    }
    _initialInFlight = true;
    state = state.copyWith(
      initialLoading: true,
      clearInitialError: true,
      clearLoadMoreError: true,
    );
    try {
      final page = await _repo.fetchPage(page: 1, limit: _pageSize);
      state = NotificationsInboxState(
        items: page.items,
        page: page.page,
        totalPages: page.totalPages,
        initialLoading: false,
      );
    } catch (e) {
      state = NotificationsInboxState(initialLoading: false, initialError: e);
    } finally {
      _initialInFlight = false;
    }
  }

  Future<void> refresh() async {
    if (!ref.read(authProvider).isAuthenticated) return;
    state = state.copyWith(clearLoadMoreError: true);
    try {
      final page = await _repo.fetchPage(page: 1, limit: _pageSize);
      state = NotificationsInboxState(
        items: page.items,
        page: page.page,
        totalPages: page.totalPages,
        initialLoading: false,
      );
      ref.invalidate(unreadNotificationsProvider);
    } catch (e) {
      state = state.copyWith(initialError: e);
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) {
      return;
    }
    if (_moreInFlight) return;
    _moreInFlight = true;
    state = state.copyWith(loadingMore: true, clearLoadMoreError: true);
    try {
      final nextPage = state.page + 1;
      final page = await _repo.fetchPage(page: nextPage, limit: _pageSize);
      final seen = state.items.map((e) => e.id).toSet();
      final appended = page.items.where((e) => !seen.contains(e.id)).toList();
      state = state.copyWith(
        items: [...state.items, ...appended],
        page: page.page,
        totalPages: page.totalPages,
        loadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(loadingMore: false, loadMoreError: e);
    } finally {
      _moreInFlight = false;
    }
  }

  Future<void> markRead(String id) async {
    final index = state.items.indexWhere((e) => e.id == id);
    if (index < 0) return;
    final current = state.items[index];
    if (current.isRead) return;

    final previousItems = state.items;
    final updated = current.copyWith(isRead: true);
    final nextItems = [...state.items];
    nextItems[index] = updated;
    state = state.copyWith(items: nextItems);

    try {
      await _repo.markRead(id);
      ref.invalidate(unreadNotificationsProvider);
    } catch (_) {
      state = state.copyWith(items: previousItems);
    }
  }

  Future<void> markAllRead() async {
    if (state.items.every((e) => e.isRead)) return;
    final previousItems = state.items;
    state = state.copyWith(
      items: state.items.map((e) => e.copyWith(isRead: true)).toList(),
    );
    try {
      await _repo.markAllRead();
      ref.invalidate(unreadNotificationsProvider);
    } catch (_) {
      state = state.copyWith(items: previousItems);
    }
  }
}

final notificationsInboxProvider =
    NotifierProvider<NotificationsInboxNotifier, NotificationsInboxState>(
      NotificationsInboxNotifier.new,
    );
