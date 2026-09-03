import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorage {
  AuthStorage(this._storage);

  final FlutterSecureStorage _storage;

  Future<void> saveToken(String token) =>
      _storage.write(key: 'access_token', value: token);

  Future<String?> readToken() => _storage.read(key: 'access_token');

  Future<void> clear() => _storage.delete(key: 'access_token');
}
