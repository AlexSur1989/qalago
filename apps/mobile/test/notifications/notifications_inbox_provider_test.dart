import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/features/notifications/data/notification_model.dart';
import 'package:qalago_mobile/features/notifications/providers/notifications_inbox_provider.dart';
import 'package:qalago_mobile/features/notifications/providers/notifications_repository_provider.dart';
import 'package:qalago_mobile/shared/models/models.dart';

class FakeNotificationsRepository extends NotificationsRepository {
  FakeNotificationsRepository() : super(Dio());

  final Map<int, PaginatedNotifications> pages = {};
  Future<PaginatedNotifications> Function({int page, int limit})? fetchOverride;
  int markReadCalls = 0;
  int markAllReadCalls = 0;
  bool markReadFails = false;

  @override
  Future<PaginatedNotifications> fetchPage({
    int page = 1,
    int limit = 20,
  }) async {
    if (fetchOverride != null) {
      return fetchOverride!(page: page, limit: limit);
    }
    return pages[page] ??
        PaginatedNotifications(
          items: const [],
          page: page,
          limit: limit,
          total: 0,
          totalPages: page,
        );
  }

  @override
  Future<int> unreadCount() async => 0;

  @override
  Future<void> markAllRead() async {
    markAllReadCalls++;
  }

  @override
  Future<void> markRead(String id) async {
    markReadCalls++;
    if (markReadFails) throw Exception('network');
  }
}

class AuthedAuth extends AuthNotifier {
  @override
  AuthState build() {
    return AuthState(
      isAuthenticated: true,
      user: UserModel(id: 'u1', role: 'USER'),
    );
  }
}

AppNotification item(String id, {bool isRead = false}) {
  return AppNotification(
    id: id,
    type: 'NEW_REVIEW',
    title: 't',
    body: 'b',
    isRead: isRead,
    createdAt: DateTime.utc(2026, 1, 1),
  );
}

PaginatedNotifications notifPage(
  int pageNum,
  List<AppNotification> items, {
  int totalPages = 1,
}) {
  return PaginatedNotifications(
    items: items,
    page: pageNum,
    limit: 20,
    total: items.length,
    totalPages: totalPages,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<ProviderContainer> boot(FakeNotificationsRepository repo) async {
    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith(AuthedAuth.new),
        notificationsRepositoryProvider.overrideWithValue(repo),
      ],
    );
    addTearDown(container.dispose);
    await Future<void>.delayed(Duration.zero);
    await container.read(notificationsInboxProvider.notifier).loadInitial();
    return container;
  }

  test('initial pagination loads page 1', () async {
    final repo = FakeNotificationsRepository()
      ..pages[1] = notifPage(1, [item('a'), item('b')]);
    final container = await boot(repo);
    final state = container.read(notificationsInboxProvider);
    expect(state.items, hasLength(2));
    expect(state.page, 1);
    expect(state.initialLoading, isFalse);
  });

  test('load next page appends without duplicate ids', () async {
    final repo = FakeNotificationsRepository()
      ..pages[1] = notifPage(1, [item('a')], totalPages: 2)
      ..pages[2] = notifPage(2, [item('a'), item('b')], totalPages: 2);
    final container = await boot(repo);
    await container.read(notificationsInboxProvider.notifier).loadMore();
    final ids = container
        .read(notificationsInboxProvider)
        .items
        .map((e) => e.id)
        .toList();
    expect(ids, ['a', 'b']);
  });

  test('refresh resets to first page', () async {
    final repo = FakeNotificationsRepository()
      ..pages[1] = notifPage(1, [item('fresh')])
      ..pages[2] = notifPage(2, [item('old')], totalPages: 2);
    final container = await boot(repo);
    await container.read(notificationsInboxProvider.notifier).loadMore();
    await container.read(notificationsInboxProvider.notifier).refresh();
    expect(container.read(notificationsInboxProvider).items.single.id, 'fresh');
  });

  test('mark read updates local state and rolls back on failure', () async {
    final repo = FakeNotificationsRepository()
      ..pages[1] = notifPage(1, [item('a', isRead: false)])
      ..markReadFails = true;
    final container = await boot(repo);
    await container.read(notificationsInboxProvider.notifier).markRead('a');
    expect(
      container.read(notificationsInboxProvider).items.first.isRead,
      isFalse,
    );
    expect(repo.markReadCalls, 1);
  });

  test('mark all read', () async {
    final repo = FakeNotificationsRepository()
      ..pages[1] = notifPage(1, [item('a'), item('b')]);
    final container = await boot(repo);
    await container.read(notificationsInboxProvider.notifier).markAllRead();
    expect(
      container.read(notificationsInboxProvider).items.every((e) => e.isRead),
      isTrue,
    );
    expect(repo.markAllReadCalls, 1);
  });

  test('initial error and retry', () async {
    final repo = FakeNotificationsRepository();
    var fail = true;
    repo.fetchOverride = ({int page = 1, int limit = 20}) async {
      if (fail) {
        fail = false;
        throw Exception('fail');
      }
      return notifPage(1, [item('ok')]);
    };
    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith(AuthedAuth.new),
        notificationsRepositoryProvider.overrideWithValue(repo),
      ],
    );
    addTearDown(container.dispose);
    await Future<void>.delayed(Duration.zero);
    await container.read(notificationsInboxProvider.notifier).loadInitial();
    expect(container.read(notificationsInboxProvider).initialError, isNotNull);
    await container.read(notificationsInboxProvider.notifier).loadInitial();
    expect(container.read(notificationsInboxProvider).items.single.id, 'ok');
  });

  test('load-more error allows retry', () async {
    final repo = FakeNotificationsRepository()
      ..pages[1] = notifPage(1, [item('a')], totalPages: 2);
    var failMore = true;
    repo.fetchOverride = ({int page = 1, int limit = 20}) async {
      if (page == 1) {
        return repo.pages[1]!;
      }
      if (failMore) {
        failMore = false;
        throw Exception('more fail');
      }
      return notifPage(2, [item('b')], totalPages: 2);
    };
    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith(AuthedAuth.new),
        notificationsRepositoryProvider.overrideWithValue(repo),
      ],
    );
    addTearDown(container.dispose);
    await Future<void>.delayed(Duration.zero);
    await container.read(notificationsInboxProvider.notifier).loadInitial();
    await container.read(notificationsInboxProvider.notifier).loadMore();
    expect(container.read(notificationsInboxProvider).loadMoreError, isNotNull);
    await container.read(notificationsInboxProvider.notifier).loadMore();
    expect(container.read(notificationsInboxProvider).items.map((e) => e.id), [
      'a',
      'b',
    ]);
  });
}
