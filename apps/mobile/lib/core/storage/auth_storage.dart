import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorage {
  AuthStorage(this._storage);

  /// In-memory storage for tests — no platform plugins required.
  AuthStorage.memory() : _storage = null;

  final FlutterSecureStorage? _storage;
  String? _memoryToken;
  String? _memoryRefreshToken;

  Future<void> saveToken(String token) async {
    if (_storage == null) {
      _memoryToken = token;
      return;
    }
    await _storage.write(key: 'access_token', value: token);
  }

  Future<void> saveRefreshToken(String token) async {
    if (_storage == null) {
      _memoryRefreshToken = token;
      return;
    }
    await _storage.write(key: 'refresh_token', value: token);
  }

  Future<String?> readToken() async {
    if (_storage == null) return _memoryToken;
    return _storage.read(key: 'access_token');
  }

  Future<String?> readRefreshToken() async {
    if (_storage == null) return _memoryRefreshToken;
    return _storage.read(key: 'refresh_token');
  }

  Future<void> clear() async {
    if (_storage == null) {
      _memoryToken = null;
      _memoryRefreshToken = null;
      return;
    }
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }
}
