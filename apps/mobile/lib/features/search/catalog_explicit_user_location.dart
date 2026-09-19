import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/location/user_location_provider.dart';
import '../../core/providers/city_provider.dart';
import '../../l10n/app_localizations.dart';
import 'search_geo_policy.dart';

/// GPS acquired via explicit user action (distance filter / nearest sort).
final catalogExplicitUserGpsProvider = StateProvider<UserPosition?>(
  (ref) => null,
);

enum CatalogUserLocationOutcome {
  success,
  servicesDisabled,
  permissionDenied,
  permissionDeniedForever,
  outsideSelectedCity,
  positionUnavailable,
}

class CatalogUserLocationResult {
  const CatalogUserLocationResult._({
    required this.outcome,
    this.position,
  });

  final CatalogUserLocationOutcome outcome;
  final UserPosition? position;

  bool get isSuccess => outcome == CatalogUserLocationOutcome.success;

  factory CatalogUserLocationResult.success(UserPosition position) {
    return CatalogUserLocationResult._(
      outcome: CatalogUserLocationOutcome.success,
      position: position,
    );
  }

  factory CatalogUserLocationResult.failure(CatalogUserLocationOutcome outcome) {
    return CatalogUserLocationResult._(outcome: outcome);
  }
}

Future<CatalogUserLocationResult>? _inFlight;

/// Resolves user GPS for catalog geo (Search radius / nearest). Never uses city center.
Future<CatalogUserLocationResult> resolveCatalogUserLocation(WidgetRef ref) async {
  if (_inFlight != null) {
    return _inFlight!;
  }

  final future = _resolveCatalogUserLocationImpl(ref);
  _inFlight = future;
  try {
    return await future;
  } finally {
    if (identical(_inFlight, future)) {
      _inFlight = null;
    }
  }
}

Future<CatalogUserLocationResult> _resolveCatalogUserLocationImpl(
  WidgetRef ref,
) async {
  final passive = ref.read(userLocationProvider).valueOrNull;
  if (passive != null && consumerHasRealNearbyGps(ref)) {
    ref.read(catalogExplicitUserGpsProvider.notifier).state = passive;
    return CatalogUserLocationResult.success(passive);
  }

  final bridge = userLocationGeolocator;
  final serviceEnabled = await bridge.isLocationServiceEnabled();
  if (!serviceEnabled) {
    return CatalogUserLocationResult.failure(
      CatalogUserLocationOutcome.servicesDisabled,
    );
  }

  var permission = await bridge.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await bridge.requestPermission();
  }

  if (permission == LocationPermission.deniedForever) {
    return CatalogUserLocationResult.failure(
      CatalogUserLocationOutcome.permissionDeniedForever,
    );
  }

  if (permission == LocationPermission.denied) {
    return CatalogUserLocationResult.failure(
      CatalogUserLocationOutcome.permissionDenied,
    );
  }

  try {
    final current = await bridge.getCurrentPosition();
    final snapped = UserPosition(
      latitude: current.latitude,
      longitude: current.longitude,
    ).snapped;

    if (!userPositionPlausibleForSelectedCity(ref, snapped)) {
      return CatalogUserLocationResult.failure(
        CatalogUserLocationOutcome.outsideSelectedCity,
      );
    }

    ref.read(catalogExplicitUserGpsProvider.notifier).state = snapped;
    return CatalogUserLocationResult.success(snapped);
  } catch (_) {
    return CatalogUserLocationResult.failure(
      CatalogUserLocationOutcome.positionUnavailable,
    );
  }
}

void clearCatalogExplicitUserGps(WidgetRef ref) {
  ref.read(catalogExplicitUserGpsProvider.notifier).state = null;
}

UserPosition? readCatalogUserGpsForGeoQueries(WidgetRef ref) {
  final explicit = ref.read(catalogExplicitUserGpsProvider);
  if (explicit != null) return explicit;
  if (consumerHasRealNearbyGps(ref)) {
    return ref.read(userLocationProvider).valueOrNull;
  }
  return null;
}

Future<void> showCatalogLocationOutcomeFeedback(
  BuildContext context,
  CatalogUserLocationResult result,
) async {
  if (!context.mounted || result.isSuccess) return;
  final l10n = AppLocalizations.of(context)!;
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;

  switch (result.outcome) {
    case CatalogUserLocationOutcome.servicesDisabled:
      messenger.showSnackBar(
        SnackBar(content: Text(l10n.searchLocationServicesDisabled)),
      );
    case CatalogUserLocationOutcome.permissionDenied:
      messenger.showSnackBar(
        SnackBar(content: Text(l10n.searchLocationNeededForDistance)),
      );
    case CatalogUserLocationOutcome.permissionDeniedForever:
      messenger.showSnackBar(
        SnackBar(
          content: Text(l10n.searchLocationDeniedForever),
          action: SnackBarAction(
            label: l10n.searchOpenAppSettings,
            onPressed: () {
              unawaited(Geolocator.openAppSettings());
            },
          ),
        ),
      );
    case CatalogUserLocationOutcome.outsideSelectedCity:
      messenger.showSnackBar(
        SnackBar(content: Text(l10n.searchLocationOutsideSelectedCity)),
      );
    case CatalogUserLocationOutcome.positionUnavailable:
      messenger.showSnackBar(
        SnackBar(content: Text(l10n.searchLocationUnavailable)),
      );
    case CatalogUserLocationOutcome.success:
      break;
  }
}
