import 'package:flutter_secure_storage/flutter_secure_storage.dart';

typedef StoredSession = ({int generation, String? token, String? refreshToken});

class AuthStorage {
  AuthStorage(this._storage);
  AuthStorage.memory() : _storage = null;

  final FlutterSecureStorage? _storage;
  String? _memoryToken;
  String? _memoryRefreshToken;
  int _generation = 0;
  int get generation => _generation;
  Future<void> _pending = Future.value();

  // Serialize platform writes, including logout racing an in-flight refresh.
  Future<T> _serial<T>(Future<T> Function() operation) {
    final result = _pending.then((_) => operation());
    _pending = result.then<void>((_) {}, onError: (Object _, StackTrace _) {});
    return result;
  }

  Future<void> _write(String key, String? value) async {
    if (_storage == null) {
      if (key == 'access_token') {
        _memoryToken = value;
      } else {
        _memoryRefreshToken = value;
      }
    } else if (value == null) {
      await _storage.delete(key: key);
    } else {
      await _storage.write(key: key, value: value);
    }
  }

  Future<String?> _read(String key) async => _storage == null
      ? (key == 'access_token' ? _memoryToken : _memoryRefreshToken)
      : _storage.read(key: key);

  Future<void> saveSession(String token, String? refreshToken) {
    _generation++;
    return _serial(() async {
      await _write('access_token', token);
      await _write('refresh_token', refreshToken);
    });
  }

  Future<void> saveToken(String token) {
    _generation++;
    return _serial(() => _write('access_token', token));
  }

  Future<void> saveRefreshToken(String token) {
    _generation++;
    return _serial(() => _write('refresh_token', token));
  }

  Future<StoredSession> readSession() => _serial(() async {
    final version = _generation;
    return (
      generation: version,
      token: await _read('access_token'),
      refreshToken: await _read('refresh_token'),
    );
  });

  Future<String?> readToken() => _serial(() => _read('access_token'));
  Future<String?> readRefreshToken() => _serial(() => _read('refresh_token'));

  Future<bool> replaceAfterRefresh(
    StoredSession previous,
    String token,
    String refreshToken,
  ) => _serial(() async {
    if (_generation != previous.generation ||
        await _read('refresh_token') != previous.refreshToken ||
        _generation != previous.generation) {
      return false;
    }
    await _write('access_token', token);
    await _write('refresh_token', refreshToken);
    return _generation == previous.generation;
  });

  Future<void> clear() {
    _generation++;
    return _serial(() async {
      await _write('access_token', null);
      await _write('refresh_token', null);
    });
  }

  Future<bool> clearIfCurrent(int generation) async {
    if (_generation != generation) return false;
    await clear();
    return _generation == generation + 1;
  }
}
