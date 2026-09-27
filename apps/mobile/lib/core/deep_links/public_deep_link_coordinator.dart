import 'dart:async';

import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../onboarding/onboarding_provider.dart';
import 'public_deep_link_executor.dart';
import 'public_deep_link_parse_result.dart';
import 'public_deep_link_parser.dart';
import 'public_deep_link_target.dart';
import 'public_deep_link_target_fingerprint.dart';

/// Holds at most one pending validated deep-link target for cold start.
final pendingPublicDeepLinkTargetProvider =
    StateProvider<PublicDeepLinkTarget?>((ref) => null);

class PublicDeepLinkCoordinator {
  PublicDeepLinkCoordinator(this.ref);

  final Ref ref;

  String? _lastExecutedFingerprint;
  DateTime? _lastExecutedAt;

  static const _dedupeWindow = Duration(seconds: 2);

  /// Single entry for OS links and tests.
  void handleIncomingUri(Uri uri) {
    final result = parsePublicDeepLink(uri);
    if (result is! PublicDeepLinkParsed) return;
    _enqueueOrExecute(result.target);
  }

  void handleIncomingUriString(String raw) {
    final result = parsePublicDeepLinkString(raw);
    if (result is! PublicDeepLinkParsed) return;
    _enqueueOrExecute(result.target);
  }

  void _enqueueOrExecute(PublicDeepLinkTarget target) {
    if (_isDuplicate(target)) return;

    if (!_isNavigationReady()) {
      ref.read(pendingPublicDeepLinkTargetProvider.notifier).state = target;
      _scheduleFlush();
      return;
    }

    unawaited(_executeTarget(target));
  }

  Future<void> tryExecutePending() async {
    final pending = ref.read(pendingPublicDeepLinkTargetProvider);
    if (pending == null) return;
    if (!_isNavigationReady()) return;
    final ok = await _executeTarget(pending);
    if (ok) {
      ref.read(pendingPublicDeepLinkTargetProvider.notifier).state = null;
    }
  }

  void _scheduleFlush() {
    SchedulerBinding.instance.addPostFrameCallback((_) {
      unawaited(tryExecutePending());
    });
  }

  bool _isNavigationReady() {
    final onboarding = ref.read(onboardingProvider);
    if (onboarding.isLoading) return false;
    if (onboarding.hasError) return false;
    if (onboarding.requireValue.requiresOnboarding) return false;
    return true;
  }

  bool _isDuplicate(PublicDeepLinkTarget target) {
    final fingerprint = publicDeepLinkTargetFingerprint(target);
    final now = DateTime.now();
    if (_lastExecutedFingerprint == fingerprint &&
        _lastExecutedAt != null &&
        now.difference(_lastExecutedAt!) < _dedupeWindow) {
      return true;
    }
    return false;
  }

  Future<bool> _executeTarget(PublicDeepLinkTarget target) async {
    final fingerprint = publicDeepLinkTargetFingerprint(target);
    final ok = await ref.read(publicDeepLinkExecutorProvider).execute(target);
    if (ok) {
      _lastExecutedFingerprint = fingerprint;
      _lastExecutedAt = DateTime.now();
    }
    return ok;
  }
}

final publicDeepLinkCoordinatorProvider = Provider<PublicDeepLinkCoordinator>(
  PublicDeepLinkCoordinator.new,
);
