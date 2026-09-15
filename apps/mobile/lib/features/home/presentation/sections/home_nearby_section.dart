import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/locale/consumer_api_errors.dart';
import '../../../../core/locale/l10n_extension.dart';
import '../../../../core/location/user_location_provider.dart';
import '../../../../core/providers/city_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/models.dart';
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
            child: _NearbyBusinessTile(business: business),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _NearbyBusinessTile extends StatelessWidget {
  const _NearbyBusinessTile({required this.business});

  final BusinessModel business;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);

    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () =>
            openBusiness(context, business.id, BusinessTrafficSource.home),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: coverUrl.isNotEmpty
                    ? Image.network(
                        coverUrl,
                        width: 112,
                        height: 92,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) =>
                            _nearbyImagePlaceholder(92, width: 112),
                      )
                    : _nearbyImagePlaceholder(92, width: 112),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      business.title,
                      style: const TextStyle(
                        color: AppTheme.textDark,
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      business.categoryTitle ??
                          context.l10n.businessGenericName,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (business.shortDesc != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        business.shortDesc!,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          color: AppTheme.textMuted,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            business.distanceMeters != null
                                ? '${formatDistanceMeters(business.distanceMeters)} · ${business.address}'
                                : business.address,
                            style: const TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 12,
                            ),
                            maxLines: 2,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Widget _nearbyImagePlaceholder(double height, {double? width}) {
  return Container(
    width: width ?? double.infinity,
    height: height,
    color: AppTheme.background,
    child: const Center(
      child: Icon(Icons.storefront, color: AppTheme.textMuted),
    ),
  );
}
