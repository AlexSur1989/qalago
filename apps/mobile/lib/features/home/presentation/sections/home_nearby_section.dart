import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../../core/locale/consumer_api_errors.dart';
import '../../../../core/locale/l10n_extension.dart';
import '../../../../core/location/user_location_provider.dart';
import '../../../../core/providers/city_provider.dart';
import '../../../../shared/models/models.dart';
import '../../../../shared/widgets/business_card.dart';
import '../../../../shared/navigation/business_traffic_source.dart';
import '../../../../shared/navigation/open_business.dart';
import '../../../../shared/utils/business_rank.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../../../shared/widgets/qalago_components.dart';
import '../../../analytics/widgets/business_impression_host.dart';
import '../../../auth/providers/auth_provider.dart';

bool homeNearbyUsesUserGps(CityState city, UserPosition? userPos) {
  if (userPos == null) return false;
  if (city.centerLat == null || city.centerLng == null) return true;
  final distanceFromCity = Geolocator.distanceBetween(
    userPos.latitude,
    userPos.longitude,
    city.centerLat!,
    city.centerLng!,
  );
  return distanceFromCity <= maxUserDistanceFromCityMeters;
}

class HomeNearbySection extends ConsumerWidget {
  const HomeNearbySection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final city = ref.watch(cityProvider);
    final userPos = ref.watch(userLocationProvider).valueOrNull;
    final usesGps = homeNearbyUsesUserGps(city, userPos);
    final nearbyPosition = ref.watch(nearbySearchPositionProvider);
    final businessesAsync = ref.watch(
      businessesProvider(
        BusinessesQuery(
          latitude: nearbyPosition.latitude,
          longitude: nearbyPosition.longitude,
          radiusKm: nearbyRadiusKm,
        ),
      ),
    );

    final title =
        usesGps ? l10n.homeNearbySection : l10n.homeNearbyCitySection;
    final subtitle =
        usesGps ? l10n.homeNearbySubtitle : l10n.homeNearbyCitySubtitle;
    final emptyMessage =
        usesGps ? l10n.homeNearbyEmpty : l10n.homeNearbyCityEmpty;

    return Column(
      key: const Key('home_section_nearby'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        QalaGoSectionHeader(title: title, subtitle: subtitle),
        const SizedBox(height: 12),
        businessesAsync.when(
          loading: () => const LoadingView(),
          error: (e, _) {
            assert(() {
              debugPrint('[QalaGo Home] nearby error: $e');
              return true;
            }());
            return ErrorView(
              message: localizedLoadError(l10n, e),
              onRetry: () => ref.invalidate(businessesProvider),
            );
          },
          data: (data) => _NearbyBusinessList(
            items: data.items,
            emptyMessage: emptyMessage,
          ),
        ),
      ],
    );
  }
}

class _NearbyBusinessList extends StatelessWidget {
  const _NearbyBusinessList({
    required this.items,
    required this.emptyMessage,
  });

  final List<BusinessModel> items;
  final String emptyMessage;

  static const _maxPreviewItems = 12;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Text(
            emptyMessage,
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    final preview = sortNearbyBusinesses(items).take(_maxPreviewItems).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final business in preview) ...[
          BusinessImpressionHost(
            businessId: business.id,
            trafficSource: BusinessTrafficSource.home,
            discoverySurface: 'NEARBY_LIST',
            child: BusinessCard(
              business: business,
              layout: BusinessCardLayout.compactHorizontal,
              onTap: () =>
                  openBusinessFromDiscovery(
                    context,
                    business,
                    BusinessTrafficSource.home,
                  ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}
