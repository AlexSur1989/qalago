import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/map/qalago_map_camera.dart';
import '../../../core/map/qalago_map_coordinate.dart';
import '../../../core/map/qalago_map_provider.dart';
import '../../../core/map/qalago_map_view.dart';
import '../../../core/map/qalago_map_renderer.dart';
import '../../../core/map/qalago_native_map_business_layer_config.dart';
import '../business_map_geo_json_builder.dart';
import '../map_overlay_markers.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/location/user_location_provider.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/providers/city_catalog_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/business_detail_utils.dart';
import '../../../shared/utils/business_rank.dart';
import '../../../shared/utils/consumer_discovery_utils.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/empty_city_view.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../analytics/widgets/business_impression_host.dart';
import '../../analytics/widgets/map_business_preview_impression.dart';
import '../map_business_markers.dart';
import '../map_business_selection_policy.dart';
import '../map_businesses_notifier.dart';
import '../map_discovery_scope.dart';
import '../map_physical_key.dart';
import '../map_screen_center.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  static const _cityZoom = 12.0;

  late final _mapController = createQalaGoMapController();
  QalaGoMapCoordinate? _lastUserCenter;
  String? _trackedCitySlug;
  String? _selectedLocationId;
  void _clearSelection() {
    if (_selectedLocationId == null) {
      return;
    }
    setState(() => _selectedLocationId = null);
  }

  void _selectMapLocation(MapBusinessesState mapBusinesses, String locationId) {
    if (!MapBusinessSelectionPolicy.isSelectableLocationId(
      locationId: locationId,
      businesses: mapBusinesses,
    )) {
      return;
    }
    if (_selectedLocationId == locationId) {
      return;
    }
    setState(() => _selectedLocationId = locationId);
  }

  void _selectMapRow(MapBusinessesState mapBusinesses, BusinessModel row) {
    _selectMapLocation(mapBusinesses, mapPhysicalKey(row));
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  void _moveToCity(
    CityState city,
    UserPosition? userPosition,
    List<BusinessModel> businesses,
  ) {
    final next = resolveMapScreenCenter(
      city: city,
      userPosition: userPosition,
      businesses: businesses,
    );
    _mapController.move(next, _cityZoom);
  }

  void _followUser(CityState city, UserPosition? userPosition) {
    if (userPosition == null) return;
    if (city.centerLat != null && city.centerLng != null) {
      final distanceFromCity = Geolocator.distanceBetween(
        userPosition.latitude,
        userPosition.longitude,
        city.centerLat!,
        city.centerLng!,
      );
      if (distanceFromCity > maxUserDistanceFromCityMeters) return;
    }

    final next = QalaGoMapCoordinate(
      latitude: userPosition.latitude,
      longitude: userPosition.longitude,
    );
    if (_lastUserCenter != null) {
      final movedMeters = Geolocator.distanceBetween(
        _lastUserCenter!.latitude,
        _lastUserCenter!.longitude,
        next.latitude,
        next.longitude,
      );
      if (movedMeters < 40) return;
    }
    _lastUserCenter = next;
    _mapController.move(next, _mapController.zoom);
  }

  @override
  Widget build(BuildContext context) {
    final city = ref.watch(cityProvider);
    final userPosition = ref.watch(userLocationProvider).valueOrNull;
    final mapBusinesses = ref.watch(mapBusinessesProvider);
    final businesses = mapBusinesses.items;

    ref.listen(userLocationProvider, (previous, next) {
      next.whenData((position) => _followUser(city, position));
    });

    ref.listen(cityProvider, (previous, next) {
      if (previous?.slug == next.slug) return;
      _clearSelection();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _moveToCity(next, userPosition, businesses);
      });
    });

    ref.listen(mapDiscoveryScopeProvider, (previous, next) {
      if (previous == next) return;
      _clearSelection();
    });

    ref.listen(mapBusinessesProvider, (previous, next) {
      final id = _selectedLocationId;
      if (id == null) return;
      if (!MapBusinessSelectionPolicy.shouldRetainSelection(
        selectedLocationId: id,
        businesses: next,
      )) {
        _clearSelection();
      }
    });
    final center = resolveMapScreenCenter(
      city: city,
      userPosition: userPosition,
      businesses: businesses,
    );
    final mapMarkers = buildBusinessMapMarkers(
      businesses: businesses,
      selectedLocationId: _selectedLocationId,
      onMarkerTap: (business) {
        _selectMapRow(mapBusinesses, business);
      },
      userLocation: userPosition == null
          ? null
          : QalaGoMapCoordinate(
              latitude: userPosition.latitude,
              longitude: userPosition.longitude,
            ),
      pinBuilder: ({
        required business,
        required selected,
        required onTap,
      }) =>
          _MapPin(
        business: business,
        selected: selected,
        onTap: onTap,
      ),
    );
    final selectedBusiness = _selectedLocationId == null
        ? null
        : mapBusinesses.byLocationId[_selectedLocationId];

    if (_trackedCitySlug != city.slug) {
      _trackedCitySlug = city.slug;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _moveToCity(city, userPosition, businesses);
      });
    }

    final l10n = context.l10n;
    final nativeBusinessLayer = QalaGoNativeMapBusinessLayerConfig.enabled;
    final businessGeoJson = nativeBusinessLayer
        ? BusinessMapGeoJsonBuilder.buildFeatureCollection(
            businesses: businesses,
            selectedLocationId: _selectedLocationId,
          )
        : null;
    final overlayMarkers = resolveMapOverlayMarkers(
      markers: mapMarkers,
      renderer: resolveQalaGoMapRenderer(),
    );

    return Scaffold(
      body: Stack(
        children: [
          QalaGoMapView(
            key: ValueKey('map-${city.slug}'),
            controller: _mapController,
            initialCamera: QalaGoMapCamera(center: center, zoom: _cityZoom),
            markers: overlayMarkers,
            businessGeoJson: businessGeoJson,
            onBusinessFeatureTap: nativeBusinessLayer
                ? (locationId) => _selectMapLocation(mapBusinesses, locationId)
                : null,
            onClusterFeatureTap: nativeBusinessLayer ? _clearSelection : null,
            onCameraIdle: (bounds) {
              ref
                  .read(mapBusinessesNotifierProvider.notifier)
                  .onViewportIdle(bounds);
            },
          ),
          if (mapBusinesses.error != null)
            Positioned(
              left: 20,
              right: 20,
              top: MediaQuery.paddingOf(context).top + 120,
              child: Material(
                color: Colors.white,
                elevation: 4,
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(l10n.mapLoadFailed),
                      ),
                      TextButton(
                        onPressed: () => ref
                            .read(mapBusinessesNotifierProvider.notifier)
                            .retry(),
                        child: Text(l10n.commonRetry),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _MapHeader(
                    cityName: ref.watch(cityLocalizedNameProvider),
                    onCityTap: () => showCityPickerSheet(context, ref),
                  ),
                  const SizedBox(height: 12),
                  Semantics(
                    button: true,
                    label: l10n.searchPlaceholder,
                    child: GestureDetector(
                    onTap: () => context.push('/search'),
                    child: AbsorbPointer(
                      child: TextField(
                        readOnly: true,
                        decoration: InputDecoration(
                          hintText: l10n.searchPlaceholder,
                          isDense: MediaQuery.textScalerOf(context).scale(1) > 1.4,
                          prefixIcon: const Icon(
                            Icons.search,
                            color: AppTheme.textMuted,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(
                              color: AppTheme.textDark.withValues(alpha: 0.08),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppTheme.kzBlue,
                              width: 1.4,
                            ),
                          ),
                          filled: true,
                          fillColor: AppTheme.light.colorScheme.surface,
                        ),
                      ),
                    ),
                  ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: Builder(
                builder: (context) {
                if (selectedBusiness != null) {
                  final business = selectedBusiness;
                  return MapBusinessPreviewImpression(
                    businessId: business.id,
                    child: _MapBusinessPreview(
                      business: businessWithDistance(
                        business,
                        userLat: userPosition?.latitude,
                        userLng: userPosition?.longitude,
                      ),
                      onClose: _clearSelection,
                      onDetails: () => openBusiness(
                            context,
                            business.id,
                            BusinessTrafficSource.map,
                          ),
                    ),
                  );
                }

                final cityCatalogTotalAsync =
                    ref.watch(cityCatalogTotalProvider);
                final cityCatalogEmpty = cityCatalogTotalAsync.hasValue &&
                    cityCatalogTotalAsync.value == 0;

                if (!mapBusinesses.loading &&
                    cityCatalogEmpty &&
                    mapBusinesses.error == null) {
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                    child: EmptyCityView(
                      cityName: ref.watch(cityLocalizedNameProvider),
                      compact: true,
                      isComingSoon: city.isComingSoon,
                      onPickCity: () => showCityPickerSheet(context, ref),
                    ),
                  );
                }

                return _MapCitySheet(
                  businesses: businesses,
                  userLat: userPosition?.latitude,
                  userLng: userPosition?.longitude,
                  onSelect: (business) =>
                      _selectMapRow(mapBusinesses, business),
                );
              },
            ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapHeader extends StatelessWidget {
  const _MapHeader({
    required this.cityName,
    required this.onCityTap,
  });

  final String cityName;
  final VoidCallback onCityTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final compactHeader = MediaQuery.sizeOf(context).width < 360;
    return Row(
      children: [
        Flexible(
          fit: FlexFit.loose,
          child: const QalaGoConsumerHeaderLogo(),
        ),
        const SizedBox(width: QalaGoSpacing.space8),
        Flexible(
          fit: FlexFit.loose,
          child: CityPill(cityName: cityName, onTap: onCityTap),
        ),
        IconButton(
          padding: compactHeader ? EdgeInsets.zero : null,
          constraints: const BoxConstraints(
            minWidth: QalaGoTouchTargets.minInteractive,
            minHeight: QalaGoTouchTargets.minInteractive,
          ),
          tooltip: l10n.homeNotificationsTooltip,
          onPressed: () => context.push('/notifications'),
          icon: Icon(
            Icons.notifications_none_rounded,
            size: compactHeader ? 24 : 31,
          ),
        ),
      ],
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin({
    required this.business,
    required this.onTap,
    this.selected = false,
  });

  final BusinessModel business;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final color = _categoryColor(business.categoryTitle);

    return Semantics(
      button: true,
      label: business.title,
      selected: selected,
      onTap: onTap,
      child: ExcludeSemantics(
        child: GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: SizedBox(
            width: selected ? 48 : 42,
            height: 68,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Container(
                  width: selected ? 48 : 42,
                  height: selected ? 48 : 42,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: selected
                        ? Border.all(color: Colors.white, width: 3)
                        : null,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.textDark.withValues(alpha: 0.18),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Icon(
                    _categoryIcon(business.categoryTitle),
                    color: Colors.white,
                    size: selected ? 22 : 20,
                  ),
                ),
                Icon(Icons.arrow_drop_down, color: color, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MapBusinessPreview extends StatelessWidget {
  const _MapBusinessPreview({
    required this.business,
    required this.onClose,
    required this.onDetails,
  });

  final BusinessModel business;
  final VoidCallback onClose;
  final VoidCallback onDetails;

  Future<void> _launch(String? url) async {
    if (url == null) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);
    final distanceLabel = formatDistanceMeters(business.distanceMeters);
    final routeUrl = buildRouteUrl(
      latitude: business.latitude,
      longitude: business.longitude,
      address: business.address,
    );
    final whatsappUrl = normalizeWhatsAppUrl(business.whatsapp);

    return Semantics(
      namesRoute: true,
      label: business.title,
      child: Material(
      color: Colors.white,
      elevation: 10,
      shadowColor: Colors.black.withValues(alpha: 0.16),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 58,
                height: 5,
                decoration: BoxDecoration(
                  color: AppTheme.textDark.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            Row(
              children: [
                const Spacer(),
                IconButton(
                  tooltip: l10n.mapCloseTooltip,
                  onPressed: onClose,
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: coverUrl.isNotEmpty
                      ? Image.network(
                          coverUrl,
                          width: 96,
                          height: 72,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _mapImagePlaceholder(),
                        )
                      : _mapImagePlaceholder(),
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
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        business.categoryTitle ?? l10n.businessGenericName,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        business.address,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (distanceLabel.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          distanceLabel,
                          style: const TextStyle(
                            color: AppTheme.kzBlue,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: onDetails,
                    child: Text(l10n.mapDetails),
                  ),
                ),
                if (whatsappUrl != null)
                  IconButton.outlined(
                    tooltip: 'WhatsApp',
                    onPressed: () => _launch(whatsappUrl),
                    icon: const Icon(Icons.chat),
                  ),
                if (routeUrl != null)
                  IconButton.outlined(
                    tooltip: l10n.businessRoute,
                    onPressed: () => _launch(routeUrl),
                    icon: const Icon(Icons.near_me),
                  ),
              ],
            ),
          ],
        ),
      ),
    ),
    );
  }
}

class _MapCitySheet extends StatelessWidget {
  const _MapCitySheet({
    required this.businesses,
    required this.onSelect,
    this.userLat,
    this.userLng,
  });

  final List<BusinessModel> businesses;
  final void Function(BusinessModel business) onSelect;
  final double? userLat;
  final double? userLng;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final withDistance = businessesWithCoordinates(businesses)
        .map(
          (b) => businessWithDistance(
            b,
            userLat: userLat,
            userLng: userLng,
          ),
        )
        .toList();
    final visible = sortNearbyBusinesses(withDistance).take(5).toList();

    final sheetMaxHeight = MediaQuery.sizeOf(context).height * 0.42;
    final compactSheet = MediaQuery.sizeOf(context).width < 360;

    return Material(
      color: Colors.white,
      elevation: 8,
      shadowColor: Colors.black.withValues(alpha: 0.16),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: sheetMaxHeight.clamp(240, 360)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 58,
                  height: 5,
                  decoration: BoxDecoration(
                    color: AppTheme.textDark.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                l10n.mapBusinessesOnMap,
                style: TextStyle(
                  color: AppTheme.textDark,
                  fontSize: compactSheet ? 20 : 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: visible.isEmpty
                    ? Center(child: Text(l10n.mapNoCoordinates))
                    : ListView.separated(
                        physics: const BouncingScrollPhysics(),
                        itemCount: visible.length,
                        separatorBuilder: (_, _) => Divider(
                          height: 18,
                          color: AppTheme.textDark.withValues(alpha: 0.06),
                        ),
                        itemBuilder: (context, index) {
                          final business = visible[index];
                          return BusinessImpressionHost(
                            businessId: business.id,
                            trafficSource: BusinessTrafficSource.map,
                            discoverySurface: 'MAP_PIN',
                            child: _MapCityTile(
                              business: business,
                              onTap: () => onSelect(business),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MapCityTile extends StatelessWidget {
  const _MapCityTile({required this.business, required this.onTap});

  final BusinessModel business;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);
    final distanceLabel = formatDistanceMeters(business.distanceMeters);

    return Semantics(
      button: true,
      label: business.title,
      child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: coverUrl.isNotEmpty
                ? Image.network(
                    coverUrl,
                    width: 96,
                    height: 72,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => _mapImagePlaceholder(),
                  )
                : _mapImagePlaceholder(),
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
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  business.categoryTitle ?? l10n.businessGenericName,
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (distanceLabel.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(
                    distanceLabel,
                    style: const TextStyle(
                      color: AppTheme.kzBlue,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    ),
    );
  }
}

Widget _mapImagePlaceholder() {
  return Container(
    width: 96,
    height: 72,
    color: AppTheme.background,
    child: const Center(
      child: Icon(Icons.storefront, color: AppTheme.textMuted),
    ),
  );
}

IconData _categoryIcon(String? title) {
  final normalized = title?.toLowerCase() ?? '';
  if (normalized.contains('бар')) return Icons.local_bar;
  if (normalized.contains('фитнес')) return Icons.fitness_center;
  if (normalized.contains('крас')) return Icons.content_cut;
  if (normalized.contains('магаз')) return Icons.shopping_bag;
  if (normalized.contains('мед')) return Icons.medical_services_outlined;
  if (normalized.contains('дет')) return Icons.child_care;
  if (normalized.contains('авто')) return Icons.directions_car;
  return Icons.restaurant;
}

Color _categoryColor(String? title) {
  final normalized = title?.toLowerCase() ?? '';
  if (normalized.contains('крас')) return const Color(0xFFEC4899);
  if (normalized.contains('фитнес')) return const Color(0xFF111827);
  if (normalized.contains('мед')) return const Color(0xFF22C55E);
  if (normalized.contains('дет')) return const Color(0xFF8B5CF6);
  if (normalized.contains('авто')) return const Color(0xFF2563EB);
  return AppTheme.kzBlue;
}
