import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/location/user_location_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/business_rank.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/empty_city_view.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/error_view.dart';
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

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  LatLng _cityCenter(CityState city, UserPosition? userPosition, List<BusinessModel> businesses) {
    if (city.centerLat != null && city.centerLng != null) {
      return LatLng(city.centerLat!, city.centerLng!);
    }
    if (userPosition != null) {
      return LatLng(userPosition.latitude, userPosition.longitude);
    }
    final withCoords = businesses
        .where((b) => b.latitude != null && b.longitude != null)
        .toList();
    if (withCoords.isNotEmpty) {
      return LatLng(withCoords.first.latitude!, withCoords.first.longitude!);
    }
    return const LatLng(51.2278, 51.3865);
  }

  void _moveToCity(CityState city, UserPosition? userPosition, List<BusinessModel> businesses) {
    final next = _cityCenter(city, userPosition, businesses);
    _mapController.move(next, 12);
  }

  void _followUser(UserPosition? userPosition) {
    if (userPosition == null) return;
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

  @override
  Widget build(BuildContext context) {
    final city = ref.watch(cityProvider);
    final userPosition = ref.watch(userLocationProvider).valueOrNull;
    final nearbyPosition = ref.watch(nearbySearchPositionProvider);
    final businessesAsync = ref.watch(
      businessesProvider(
        BusinessesQuery(
          latitude: nearbyPosition.latitude,
          longitude: nearbyPosition.longitude,
          radiusKm: 15,
        ),
      ),
    );

    ref.listen(userLocationProvider, (previous, next) {
      next.whenData(_followUser);
    });

    ref.listen(cityProvider, (previous, next) {
      if (previous?.slug == next.slug) return;
      businessesAsync.whenData((data) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _moveToCity(next, userPosition, data.items);
        });
      });
    });

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          businessesAsync.when(
            loading: () => FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _cityCenter(city, userPosition, const []),
                initialZoom: 12,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'kz.qalago.mobile',
                ),
              ],
            ),
            error: (e, _) => ErrorView(
              message: '$e',
              onRetry: () => ref.invalidate(businessesProvider),
            ),
            data: (data) {
              if (_trackedCitySlug != city.slug) {
                _trackedCitySlug = city.slug;
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (!mounted) return;
                  _moveToCity(city, userPosition, data.items);
                });
              }

              final withCoords = data.items
                  .where((b) => b.latitude != null && b.longitude != null)
                  .toList();

              final center = _cityCenter(city, userPosition, data.items);

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
                    height: 68,
                    child: _MapPin(
                      business: business,
                      onTap: () => context.push('/business/${business.id}'),
                    ),
                  ),
                ),
              ];

              return FlutterMap(
                key: ValueKey('map-${city.slug}'),
                mapController: _mapController,
                options: MapOptions(initialCenter: center, initialZoom: 12),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'kz.qalago.mobile',
                  ),
                  MarkerLayer(markers: markers),
                ],
              );
            },
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
          businessesAsync.maybeWhen(
            data: (data) => Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: data.total == 0
                  ? Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                      child: EmptyCityView(
                        cityName: city.nameRu,
                        compact: true,
                        isComingSoon: city.isComingSoon,
                        onPickCity: () => showCityPickerSheet(context, ref),
                      ),
                    )
                  : _NearbySheet(businesses: data.items),
            ),
            orElse: () => const SizedBox.shrink(),
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
  const _MapPin({required this.business, required this.onTap});

  final BusinessModel business;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = _categoryColor(business.categoryTitle);

    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
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
            ),
          ),
          Icon(Icons.arrow_drop_down, color: color, size: 22),
        ],
      ),
    );
  }
}

class _NearbySheet extends StatelessWidget {
  const _NearbySheet({required this.businesses});

  final List<BusinessModel> businesses;

  @override
  Widget build(BuildContext context) {
    final split = splitNearbyBusinesses(businesses);
    final priority = split.priority.take(3).toList();
    final regular = split.regular.take(5 - priority.length).toList();
    final visible = [...priority, ...regular];

    return Material(
      color: Colors.white,
      elevation: 8,
      shadowColor: Colors.black.withValues(alpha: 0.16),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: SizedBox(
        height: priority.isNotEmpty ? 320 : 286,
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
                'Рядом с вами',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              if (priority.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  'Приоритетные: ${priority.map((b) => b.planBadgeLabel ?? b.title).join(', ')}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppTheme.kzBlue.withValues(alpha: 0.9),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Expanded(
                child: visible.isEmpty
                    ? const Center(child: Text('Нет заведений рядом'))
                    : ListView.separated(
                        physics: const BouncingScrollPhysics(),
                        itemCount: visible.length,
                        separatorBuilder: (_, _) => Divider(
                          height: 18,
                          color: Colors.black.withValues(alpha: 0.06),
                        ),
                        itemBuilder: (context, index) {
                          final business = visible[index];
                          return _NearbyMapTile(
                            business: business,
                            emphasizePlan: isPriorityBusiness(business),
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

class _NearbyMapTile extends StatelessWidget {
  const _NearbyMapTile({
    required this.business,
    this.emphasizePlan = false,
  });

  final BusinessModel business;
  final bool emphasizePlan;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);
    final distanceLabel = formatDistanceMeters(business.distanceMeters);

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => context.push('/business/${business.id}'),
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
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        business.title,
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (business.planBadgeLabel != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: business.isTopCity
                              ? AppTheme.kzGold
                              : AppTheme.kzBlue,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          business.planBadgeLabel!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                  ],
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
