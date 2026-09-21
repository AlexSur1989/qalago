import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/notifications/navigation/notification_navigator.dart';
import '../locale/app_locale_provider.dart';
import '../router/app_router.dart';
import 'push_message_mapper.dart';
import 'push_providers.dart';
import 'push_registration_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kIsWeb) return;
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
  } catch (_) {
    return;
  }
}

Future<void> initializePushFirebase() async {
  if (kIsWeb) return;
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (_) {
    // Local dev without google-services / GoogleService-Info — safe no-op.
  }
}

final pushLifecycleProvider = Provider<void>((ref) {
  ref.watch(authPushSyncProvider);
  ref.watch(pushTapNavigationProvider);
});

final authPushSyncProvider = Provider<void>((ref) {
  ref.listen<bool>(
    authProvider.select((s) => s.isAuthenticated),
    (previous, next) async {
      final service = ref.read(pushRegistrationServiceProvider);
      if (!next) {
        await service.revokeCurrentTokenBestEffort();
        return;
      }
      if (previous == next) return;
      final locale = ref.read(appLocaleProvider).languageCode;
      await service.syncForAuthenticatedUser(localeTag: locale);
    },
  );
});

final pushTapNavigationProvider = Provider<void>((ref) {
  if (kIsWeb) return;

  unawaited((() async {
    if (!await PushRegistrationService.isFirebaseConfigured) return;

    Future<void> handleData(Map<String, dynamic> data) async {
      if (pushDataContainsUnsafeRoute(data)) return;
      final notification = appNotificationFromPushData(data);
      if (notification == null) return;

      final context = qalagoRootNavigatorKey.currentContext;
      if (context == null || !context.mounted) return;

    await handlePushNotificationOpen(ref, context, notification);
    }

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      unawaited(handleData(message.data));
    });

    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) {
      await handleData(initial.data);
    }

    FirebaseMessaging.onMessage.listen((message) {
      if (message.notification != null) return;
      unawaited(handleData(message.data));
    });
  })());
});
