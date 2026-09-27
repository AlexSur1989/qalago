import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../onboarding/onboarding_provider.dart';
import 'public_deep_link_coordinator.dart';

/// Subscribes to platform URIs and flushes pending targets after onboarding.
final publicDeepLinkBootstrapProvider = Provider<void>((ref) {
  final coordinator = ref.read(publicDeepLinkCoordinatorProvider);
  StreamSubscription<Uri>? subscription;

  ref.listen<AsyncValue<OnboardingSnapshot>>(onboardingProvider, (_, next) {
    unawaited(coordinator.tryExecutePending());
  });

  if (!kIsWeb) {
    try {
      final appLinks = AppLinks();
      subscription = appLinks.uriLinkStream.listen((uri) {
        coordinator.handleIncomingUri(uri);
      });
      unawaited(() async {
        try {
          final initial = await appLinks.getInitialLink();
          if (initial != null) {
            coordinator.handleIncomingUri(initial);
          }
        } catch (_) {}
      }());
    } catch (_) {
      // Desktop/tests without platform channel — coordinator still testable directly.
    }
  }

  ref.onDispose(() {
    unawaited(subscription?.cancel());
  });
});
