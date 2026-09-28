import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'push_device_api.dart';

class PushRegistrationService {
  PushRegistrationService({
    required PushDeviceApi api,
    FirebaseMessaging? messaging,
  })  : _api = api,
        _messaging = messaging;

  final PushDeviceApi _api;
  final FirebaseMessaging? _messaging;

  FirebaseMessaging get _messagingInstance =>
      _messaging ?? FirebaseMessaging.instance;
  String? _lastRegisteredToken;
  String? _lastLocaleTag;
  StreamSubscription<String>? _tokenRefreshSubscription;

  static Future<bool> get isFirebaseConfigured async {
    if (kIsWeb) return false;
    try {
      return Firebase.apps.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  PushPlatformDto get _platform => Platform.isIOS
      ? PushPlatformDto.ios
      : PushPlatformDto.android;

  Future<void> syncForAuthenticatedUser({required String? localeTag}) async {
    if (!await isFirebaseConfigured) return;

    final settings = await _messagingInstance.getNotificationSettings();
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return;
    }

    final token = await _messagingInstance.getToken();
    if (token == null || token.isEmpty) return;

    _lastLocaleTag = localeTag;
    await _registerToken(token, localeTag);
    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = _messagingInstance.onTokenRefresh.listen((next) async {
      await _registerToken(next, _lastLocaleTag);
    });
  }

  Future<void> requestPermissionAndRegister({required String? localeTag}) async {
    if (!await isFirebaseConfigured) return;

    if (Platform.isIOS) {
      await _messagingInstance.requestPermission(alert: true, badge: true, sound: true);
    } else if (Platform.isAndroid) {
      await _messagingInstance.requestPermission();
    }

    await syncForAuthenticatedUser(localeTag: localeTag);
  }

  Future<void> revokeCurrentTokenBestEffort() async {
    if (!await isFirebaseConfigured) return;
    try {
      final token = _lastRegisteredToken ?? await _messagingInstance.getToken();
      if (token != null && token.isNotEmpty) {
        await _api.revoke(token: token);
      }
      await _messagingInstance.deleteToken();
    } catch (_) {
      // Logout must not fail because push revoke failed.
    } finally {
      _lastRegisteredToken = null;
      _lastLocaleTag = null;
      await _tokenRefreshSubscription?.cancel();
      _tokenRefreshSubscription = null;
    }
  }

  Future<void> _registerToken(String token, String? localeTag) async {
    await _api.register(
      token: token,
      platform: _platform,
      locale: localeTag,
    );
    _lastRegisteredToken = token;
  }
}
