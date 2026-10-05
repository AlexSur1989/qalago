import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/network/auth_refresh_interceptor.dart';
import 'package:qalago_mobile/core/storage/auth_storage.dart';

class FakeAdapter implements HttpClientAdapter {
  FakeAdapter(this.reply);
  final Future<ResponseBody> Function(RequestOptions) reply;
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? stream,
    Future<void>? cancelFuture,
  ) => reply(options);
  @override
  void close({bool force = false}) {}
}

ResponseBody response(int code, [Object data = const {}]) =>
    ResponseBody.fromString(
      jsonEncode(data),
      code,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );

void main() {
  late Dio dio;
  late Dio refresh;
  late AuthStorage storage;
  late int refreshCalls;
  late int expired;
  setUp(() async {
    storage = AuthStorage.memory();
    await storage.saveSession('old', 'refresh-old');
    refreshCalls = 0;
    expired = 0;
    dio = Dio(BaseOptions(baseUrl: 'https://unit.invalid/api/v1'));
    refresh = Dio(BaseOptions(baseUrl: 'https://unit.invalid/api/v1'));
    refresh.httpClientAdapter = FakeAdapter((_) async {
      refreshCalls++;
      return response(200, {
        'accessToken': 'new',
        'refreshToken': 'refresh-new',
      });
    });
    dio.httpClientAdapter = FakeAdapter(
      (request) async => response(
        request.headers['Authorization'] == 'Bearer new' ? 200 : 401,
      ),
    );
    dio.interceptors.add(
      AuthRefreshInterceptor(dio, refresh, storage, (_) => expired++),
    );
  });
  tearDown(() {
    dio.close();
    refresh.close();
  });

  test(
    'coalesces simultaneous 401 responses and retries all requests',
    () async {
      final allStarted = Completer<void>();
      var oldRequests = 0;
      dio.httpClientAdapter = FakeAdapter((request) async {
        if (request.headers['Authorization'] == 'Bearer new') {
          return response(200);
        }
        if (++oldRequests == 3) allStarted.complete();
        return response(401);
      });
      refresh.httpClientAdapter = FakeAdapter((_) async {
        refreshCalls++;
        await allStarted.future;
        return response(200, {
          'accessToken': 'new',
          'refreshToken': 'refresh-new',
        });
      });
      final results = await Future.wait([
        dio.get('/a'),
        dio.get('/b'),
        dio.get('/c'),
      ]);
      expect(results.map((r) => r.statusCode), everyElement(200));
      expect(refreshCalls, 1);
      expect(await storage.readRefreshToken(), 'refresh-new');
    },
  );

  test('a second 401 ends the session without another refresh', () async {
    var requests = 0;
    dio.httpClientAdapter = FakeAdapter((_) async {
      requests++;
      return response(401);
    });
    await expectLater(dio.get('/private'), throwsA(isA<DioException>()));
    expect(refreshCalls, 1);
    expect(requests, 2);
    expect(expired, 1);
    expect(await storage.readToken(), isNull);
  });

  test(
    'server failure on retry does not erase valid rotated credentials',
    () async {
      dio.httpClientAdapter = FakeAdapter(
        (r) async =>
            response(r.headers['Authorization'] == 'Bearer new' ? 500 : 401),
      );
      await expectLater(dio.get('/private'), throwsA(isA<DioException>()));
      expect(await storage.readToken(), 'new');
      expect(expired, 0);
    },
  );

  test('transient refresh failure preserves credentials', () async {
    refresh.httpClientAdapter = FakeAdapter((_) async => response(503));
    await expectLater(dio.get('/private'), throwsA(isA<DioException>()));
    expect(await storage.readRefreshToken(), 'refresh-old');
    expect(expired, 0);
  });

  test('rejected refresh clears credentials once', () async {
    refresh.httpClientAdapter = FakeAdapter((_) async => response(401));
    await expectLater(dio.get('/private'), throwsA(isA<DioException>()));
    expect(await storage.readToken(), isNull);
    expect(expired, 1);
  });

  test('late refresh success cannot restore a logged-out session', () async {
    final started = Completer<void>();
    final complete = Completer<ResponseBody>();
    refresh.httpClientAdapter = FakeAdapter((_) {
      started.complete();
      return complete.future;
    });
    final request = expectLater(
      dio.get('/private'),
      throwsA(isA<DioException>()),
    );
    await started.future;
    await storage.clear();
    complete.complete(
      response(200, {'accessToken': 'late', 'refreshToken': 'late-refresh'}),
    );
    await request;
    expect(await storage.readToken(), isNull);
    expect(await storage.readRefreshToken(), isNull);
    expect(expired, 0);
  });

  test('late refresh failure cannot log out a new account', () async {
    final started = Completer<void>();
    final complete = Completer<ResponseBody>();
    refresh.httpClientAdapter = FakeAdapter((_) {
      started.complete();
      return complete.future;
    });
    final request = expectLater(
      dio.get('/private'),
      throwsA(isA<DioException>()),
    );
    await started.future;
    await storage.saveSession('other-account', 'other-refresh');
    complete.complete(response(401));
    await request;
    expect(await storage.readToken(), 'other-account');
    expect(expired, 0);
  });

  test('late refresh success cannot overwrite a new account', () async {
    final started = Completer<void>();
    final complete = Completer<ResponseBody>();
    refresh.httpClientAdapter = FakeAdapter((_) {
      started.complete();
      return complete.future;
    });
    final request = expectLater(
      dio.get('/private'),
      throwsA(isA<DioException>()),
    );
    await started.future;
    await storage.saveSession('other-account', 'other-refresh');
    complete.complete(
      response(200, {'accessToken': 'late', 'refreshToken': 'late-refresh'}),
    );
    await request;
    expect(await storage.readToken(), 'other-account');
    expect(await storage.readRefreshToken(), 'other-refresh');
  });

  test(
    'delayed old-token 401 uses current token without refreshing again',
    () async {
      final slowStarted = Completer<void>();
      final releaseSlow = Completer<void>();
      dio.httpClientAdapter = FakeAdapter((r) async {
        if (r.headers['Authorization'] == 'Bearer new') return response(200);
        if (r.path == '/slow') {
          slowStarted.complete();
          await releaseSlow.future;
        }
        return response(401);
      });
      final slow = dio.get('/slow');
      await slowStarted.future;
      await dio.get('/fast');
      releaseSlow.complete();
      expect((await slow).statusCode, 200);
      expect(refreshCalls, 1);
    },
  );

  test('login failure never triggers refresh', () async {
    await expectLater(
      dio.post('/auth/verify-code'),
      throwsA(isA<DioException>()),
    );
    expect(refreshCalls, 0);
    expect(await storage.readToken(), 'old');
  });

  test(
    'new login without refresh clears the previous account refresh',
    () async {
      await storage.saveSession('new-login', null);
      expect(await storage.readRefreshToken(), isNull);
    },
  );

  test('queued clear wins over already queued refresh persistence', () async {
    final previous = await storage.readSession();
    final saving = storage.replaceAfterRefresh(
      previous,
      'late',
      'late-refresh',
    );
    final clearing = storage.clear();
    await Future.wait([saving, clearing]);
    expect(await storage.readToken(), isNull);
    expect(await storage.readRefreshToken(), isNull);
  });
}
