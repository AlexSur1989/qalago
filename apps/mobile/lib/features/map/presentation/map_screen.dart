import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/location/user_location_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/business_detail_utils.dart';
import '../../../shared/utils/business_rank.dart';
import '../../../shared/utils/consumer_discovery_utils.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/empty_city_view.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../analytics/widgets/business_impression_host.dart';
import '../../analytics/widgets/map_business_preview_impression.dart';
import '../../auth/providers/auth_provider.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  final _mapController = MapController();
  LatLng? _lastUserCenter;
  String? _trackedCitySlug;
  String? _selectedBusinessId;

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  LatLng _resolveCenter(
    CityState city,
    UserPosition? userPosition,
    List<BusinessModel> businesses,
  ) {
    final center = mapInitialCenter(
      cityCenterLat: city.centerLat,
      cityCenterLng: city.centerLng,
      userLat: userPosition?.latitude,
      userLng: userPosition?.longitude,
    );
    if (center.lat == city.centerLat && center.lng == city.centerLng) {
      return LatLng(center.lat, center.lng);
    }
    if (userPosition != null &&
        center.lat == userPosition.latitude &&
        center.lng == userPosition.longitude) {
      return LatLng(center.lat, center.lng);
    }
    final withCoords = businessesWithCoordinates(businesses);
    if (withCoords.isNotEmpty &&
        city.centerLat == null &&
        city.centerLng == null) {
      return LatLng(withCoords.first.latitude!, withCoords.first.longitude!);
    }
    return LatLng(center.lat, center.lng);
  }

  void _moveToCity(
    CityState city,
    UserPosition? userPosition,
    List<BusinessModel> businesses,
  ) {
    final next = _resolveCenter(city, userPosition, businesses);
    _mapController.move(next, 12);
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

    final next = LatLng(userPosition.latitude, userPosition.longitude);
    if (_lastUserCenter != null &&
        const Distance().as(
              LengthUnit.Meter,
              _lastUserCenter!,
              next,
            ) <
            40) {
      return;
    }
    _lastUserCenter = next;
    _mapController.move(next, _mapController.camera.zoom);
  }

  List<Widget> _mapLayers({
    required List<BusinessModel> businesses,
    required UserPosition? userPosition,
    required void Function(BusinessModel business) onMarkerTap,
  }) {
    final withCoords = businessesWithCoordinates(businesses);

    final markers = <Marker>[
      if (userPosition != null)
        Marker(
          point: LatLng(userPosition.latitude, userPosition.longitude),
          width: 28,
          height: 28,
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.kzBlue,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 8,
                ),
              ],
            ),
          ),
        ),
      ...withCoords.map(
        (business) => Marker(
          point: LatLng(business.latitude!, business.longitude!),
          width: 50,
          height: business.id == _selectedBusinessId ? 72 : 68,
          child: _MapPin(
            business: business,
            selected: business.id == _selectedBusinessId,
            onTap: () => onMarkerTap(business),
          ),
        ),
      ),
    ];

    return [
      TileLayer(
        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        userAgentPackageName: 'kz.qalago.mobile',
      ),
      MarkerLayer(markers: markers),
      RichAttributionWidget(
        alignment: AttributionAlignment.bottomLeft,
        attributions: const [
          TextSourceAttribution('OpenStreetMap contributors'),
        ],
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final city = ref.watch(cityProvider);
    final userPosition = ref.watch(userLocationProvider).valueOrNull;
    final businessesAsync = ref.watch(mapBusinessesProvider);

    ref.listen(userLocationProvider, (previous, next) {
      next.whenData((position) => _followUser(city, position));
    });

    ref.listen(cityProvider, (previous, next) {
      if (previous?.slug == next.slug) return;
      setState(() => _selectedBusinessId = null);
      businessesAsync.whenData((data) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _moveToCity(next, userPosition, data.items);
        });
      });
    });

    final businesses = businessesAsync.valueOrNull?.items ?? const <BusinessModel>[];
    final center = _resolveCenter(city, userPosition, businesses);
    BusinessModel? selectedBusiness;
    if (_selectedBusinessId != null) {
      for (final business in businesses) {
        if (business.id == _selectedBusinessId) {
          selectedBusiness = business;
          break;
        }
      }
    }

    if (_trackedCitySlug != city.slug) {
      _trackedCitySlug = city.slug;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _moveToCity(city, userPosition, businesses);
      });
    }

    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            key: ValueKey('map-${city.slug}'),
            mapController: _mapController,
            options: MapOptions(initialCenter: center, initialZoom: 12),
            children: _mapLayers(
              businesses: businesses,
              userPosition: userPosition,
              onMarkerTap: (business) {
                setState(() => _selectedBusinessId = business.id);
              },
            ),
          ),
          if (businessesAsync.hasError)
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
                      const Expanded(
                        child: Text('Не удалось загрузить заведения на карте'),
                      ),
                      TextButton(
                        onPressed: () => ref.invalidate(mapBusinessesProvider),
                        child: const Text('Повторить'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _MapHeader(
                    cityName: city.nameRu,
                    onCityTap: () => showCityPickerSheet(context, ref),
                  ),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () => context.push('/search'),
                    child: AbsorbPointer(
                      child: TextField(
                        readOnly: true,
                        decoration: InputDecoration(
                          hintText: 'Поиск заведений и услуг...',
                          prefixIcon: const Icon(
                            Icons.search,
                            color: Color(0xFF8A919F),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(
                              color: Colors.black.withValues(alpha: 0.08),
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
                          fillColor: Colors.white,
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
            child: businessesAsync.maybeWhen(
              data: (data) {
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
                      onClose: () => setState(() => _selectedBusinessId = null),
                      onDetails: () => openBusiness(
                            context,
                            business.id,
                            BusinessTrafficSource.map,
                          ),
                    ),
                  );
                }

                if (data.total == 0) {
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                    child: EmptyCityView(
                      cityName: city.nameRu,
                      compact: true,
                      isComingSoon: city.isComingSoon,
                      onPickCity: () => showCityPickerSheet(context, ref),
                    ),
                  );
                }

                return _MapCitySheet(
                  businesses: data.items,
                  userLat: userPosition?.latitude,
                  userLng: userPosition?.longitude,
                  onSelect: (business) =>
                      setState(() => _selectedBusinessId = business.id),
                );
              },
              orElse: () => const SizedBox.shrink(),
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
    return Row(
      children: [
        const Expanded(child: QalaGoLogo(fontSize: 34)),
        CityPill(cityName: cityName, onTap: onCityTap),
        const SizedBox(width: 8),
        IconButton(
          onPressed: () => context.push('/notifications'),
          icon: const Icon(Icons.notifications_none_rounded, size: 31),
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

    return GestureDetector(
      onTap: onTap,
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
                    color: Colors.black.withValues(alpha: 0.18),
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
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);
    final distanceLabel = formatDistanceMeters(business.distanceMeters);
    final routeUrl = buildRouteUrl(
      latitude: business.latitude,
      longitude: business.longitude,
      address: business.address,
    );
    final whatsappUrl = normalizeWhatsAppUrl(business.whatsapp);

    return Material(
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
                  color: Colors.black.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            Row(
              children: [
                const Spacer(),
                IconButton(
                  tooltip: 'Закрыть',
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
                          color: Colors.black,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        business.categoryTitle ?? 'Заведение',
                        style: const TextStyle(
                          color: Color(0xFF7B8291),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        business.address,
                        style: const TextStyle(
                          color: Color(0xFF596171),
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
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: onDetails,
                    child: const Text('Подробнее'),
                  ),
                ),
                if (whatsappUrl != null) ...[
                  const SizedBox(width: 8),
                  IconButton.outlined(
                    tooltip: 'WhatsApp',
                    onPressed: () => _launch(whatsappUrl),
                    icon: const Icon(Icons.chat),
                  ),
                ],
                if (routeUrl != null) ...[
                  const SizedBox(width: 4),
                  IconButton.outlined(
                    tooltip: 'Маршрут',
                    onPressed: () => _launch(routeUrl),
                    icon: const Icon(Icons.near_me),
                  ),
                ],
              ],
            ),
          ],
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

    return Material(
      color: Colors.white,
      elevation: 8,
      shadowColor: Colors.black.withValues(alpha: 0.16),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: SizedBox(
        height: 286,
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
                    color: Colors.black.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Заведения на карте',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: visible.isEmpty
                    ? const Center(child: Text('Нет заведений с координатами'))
                    : ListView.separated(
                        physics: const BouncingScrollPhysics(),
                        itemCount: visible.length,
                        separatorBuilder: (_, _) => Divider(
                          height: 18,
                          color: Colors.black.withValues(alpha: 0.06),
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
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);
    final distanceLabel = formatDistanceMeters(business.distanceMeters);

    return InkWell(
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
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  business.categoryTitle ?? 'Заведение',
                  style: const TextStyle(
                    color: Color(0xFF7B8291),
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
    );
  }
}

Widget _mapImagePlaceholder() {
  return Container(
    width: 96,
    height: 72,
    color: const Color(0xFFF0F2F5),
    child: const Center(
      child: Icon(Icons.storefront, color: Color(0xFF8A919F)),
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
