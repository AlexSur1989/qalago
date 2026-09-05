import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorage {
  AuthStorage(this._storage);

  /// In-memory storage for tests — no platform plugins required.
  AuthStorage.memory() : _storage = null;

  final FlutterSecureStorage? _storage;
  String? _memoryToken;

  Future<void> saveToken(String token) async {
    if (_storage == null) {
      _memoryToken = token;
      return;
    }
    await _storage.write(key: 'access_token', value: token);
  }

  Future<String?> readToken() async {
    if (_storage == null) return _memoryToken;
    return _storage.read(key: 'access_token');
  }

  Future<void> clear() async {
    if (_storage == null) {
      _memoryToken = null;
      return;
    }
    await _storage.delete(key: 'access_token');
  }
}
