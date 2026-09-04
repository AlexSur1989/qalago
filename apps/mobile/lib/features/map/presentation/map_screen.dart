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
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  final _mapController = MapController();
  LatLng? _lastUserCenter;

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
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
    final businessesAsync = ref.watch(
      businessesProvider(
        BusinessesQuery(
          latitude: userPosition?.latitude,
          longitude: userPosition?.longitude,
        ),
      ),
    );

    ref.listen(userLocationProvider, (previous, next) {
      next.whenData(_followUser);
    });

    return Scaffold(
      backgroundColor: Colors.white,
      body: businessesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(businessesProvider),
        ),
        data: (data) {
          final withCoords = data.items
              .where((b) => b.latitude != null && b.longitude != null)
              .toList();

          final center = userPosition != null
              ? LatLng(userPosition.latitude, userPosition.longitude)
              : withCoords.isNotEmpty
                  ? LatLng(
                      withCoords.first.latitude!,
                      withCoords.first.longitude!,
                    )
                  : const LatLng(51.2278, 51.3865);

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

          return Stack(
            children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(initialCenter: center, initialZoom: 14),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'kz.qalago.mobile',
                  ),
                  MarkerLayer(markers: markers),
                ],
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                  child: Column(
                    children: [
                      _MapHeader(cityName: city.nameRu),
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
                child: _NearbySheet(businesses: data.items),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _MapHeader extends StatelessWidget {
  const _MapHeader({required this.cityName});

  final String cityName;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: const QalaGoLogo(fontSize: 34),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.black.withValues(alpha: 0.09)),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: AppTheme.kzBlue, size: 20),
                const SizedBox(width: 6),
                Text(
                  cityName,
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const Icon(
                  Icons.keyboard_arrow_down,
                  color: Color(0xFF808796),
                  size: 20,
                ),
              ],
            ),
          ),
        ),
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
                'Рядом с вами',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: businesses.isEmpty
                    ? const Center(child: Text('Нет заведений рядом'))
                    : ListView.separated(
                        physics: const BouncingScrollPhysics(),
                        itemCount: businesses.take(5).length,
                        separatorBuilder: (_, _) => Divider(
                          height: 18,
                          color: Colors.black.withValues(alpha: 0.06),
                        ),
                        itemBuilder: (context, index) {
                          final business = businesses[index];
                          return _NearbyMapTile(business: business);
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
  const _NearbyMapTile({required this.business});

  final BusinessModel business;

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
